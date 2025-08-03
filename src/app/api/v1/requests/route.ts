import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
// IMPORT the new notification service
import { sendConsentRequestNotification } from '@/lib/notification-service';
// Zod schema for request body validation
const createRequestSchema = z.object({
  ownerExternalId: z.string().min(1, { message: "ownerExternalId is required" }),
  schemaId: z.string().min(1, { message: "schemaId is required" }),
  providerId: z.string().cuid({ message: "Invalid providerId format" }),
  expiresIn: z.number().int().positive().optional().default(3600),
});

export async function POST(request: NextRequest) {
  const { institution: requester, error: authError } = await authenticateInstitution(request);
  if (authError || !requester) return authError ?? new NextResponse('Authentication failed', { status: 401 });

  const body = await request.json();
  const validation = createRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
  }
  const { ownerExternalId, schemaId, providerId, expiresIn } = validation.data;
  
  try {
    const [provider, schema, relationship] = await Promise.all([
      // Use select to only fetch the data we need
      prisma.institution.findUnique({ where: { id: providerId }, select: { id: true, name: true } }),
      prisma.dataSchema.findUnique({ where: { schemaId }, select: { id: true, description: true } }),
      prisma.relationship.findFirst({
        where: {
          requesterRole: { institutions: { some: { id: requester.id } } },
          providerRole: { institutions: { some: { id: providerId } } },
          dataSchema: { schemaId },
          status: 'ACTIVE',
        },
      }),
    ]);
    
    if (!provider || !schema) {
      return NextResponse.json({ error: 'Invalid providerId or schemaId' }, { status: 404 });
    }
    if (!relationship) {
      return NextResponse.json({ error: 'This request is not permitted by the established rules', status: 403 });
    }

    // UPDATED: Select the fcmToken when finding the user
    const dataOwner = await prisma.user.upsert({
      where: { externalId: ownerExternalId },
      update: {},
      create: { externalId: ownerExternalId },
      select: { id: true, fcmToken: true }
    });
    
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const dataRequest = await prisma.dataRequest.create({
      data: {
        requesterId: requester.id,
        providerId: provider.id,
        dataOwnerId: dataOwner.id,
        dataSchemaId: schema.id,
        status: 'AWAITING_CONSENT',
        expiresAt,
      },
    });

    // --- INTEGRATED NOTIFICATION LOGIC ---
    if (dataOwner.fcmToken) {
      // We send the notification but DON'T await it or block the response.
      // The API request should succeed even if the push notification fails.
      // This is known as "fire and forget".
      sendConsentRequestNotification({
        fcmToken: dataOwner.fcmToken,
        requestId: dataRequest.id,
        requesterName: requester.name,
        providerName: provider.name,
        schemaName: schema.description,
      }).catch(err => {
        // Log the error for monitoring, but don't fail the API call.
        console.error(`[Non-blocking Error] Failed to send push notification for request ${dataRequest.id}:`, err);
      });
    } else {
      console.warn(`User with externalId ${ownerExternalId} does not have an FCM token. Cannot send push notification.`);
    }

    // Respond to the client immediately
    return NextResponse.json({
      requestId: dataRequest.id,
      status: dataRequest.status,
      expiresAt: dataRequest.expiresAt,
    }, { status: 202 });

  } catch (err) {
    console.error('Error creating data request:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// File: /app/api/v1/requests/outgoing/route.ts

// Shared query param schema
const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: NextRequest) {
  // 1. Auth
  const { institution: requester, error: authError } = await authenticateInstitution(request);
  if (authError || !requester) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { status, page, limit, fromDate, toDate } = parseResult.data;

  // 3. Prisma filter
  const where: any = {
    requesterId: requester.id,
  };

  if (status) {
    where.status = status;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // 4. Query DB
  try {
    const [requests, totalCount] = await Promise.all([
      prisma.dataRequest.findMany({
        where,
        include: {
          provider: true,
          dataOwner: true,
          dataSchema: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dataRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
