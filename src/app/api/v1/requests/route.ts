import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';
import { z } from 'zod';
import { sendConsentRequestNotification } from '@/lib/notification-service';

// THE FIX (Zod Syntax): Use modern Zod syntax for required fields and messages.
const createRequestSchema = z.object({
  providerId: z.string().cuid({ message: "Invalid providerId format." }),
  dataOwnerId: z.string().min(1, { message: "dataOwnerId is required" }), // min(1) is the modern way to require a string
  dataSchemaId: z.string().cuid({ message: "Invalid dataSchemaId format." }),
  expiresIn: z.number().int().positive().optional().default(3600),
});

async function handler(request: AuthenticatedRequest) {
  const requester = request.institution;

  try {
    const body = await request.json();
    const validation = createRequestSchema.safeParse(body);

    if (!validation.success) {
      // THE FIX (Zod Syntax): Use `.issues` instead of the deprecated `.format()`
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }
    const { providerId, dataOwnerId, dataSchemaId, expiresIn } = validation.data;

    // THE FIX (Prisma Query): Correctly structure the `where` and `include` clauses.
    const relationship = await prisma.relationship.findFirst({
      where: {
        requesterRoleId: requester.roleId,
        // To filter by a property of a related model, you must nest it.
        providerRole: {
          institutions: {
            some: { id: providerId }
          }
        },
        dataSchemaId: dataSchemaId,
        status: 'ACTIVE',
      },
      // To access related data, you must include it.
      include: {
        providerRole: {
          include: {
            // We need to go one level deeper to get the provider institution's name
            institutions: {
              where: { id: providerId },
              select: { name: true }
            }
          }
        },
        dataSchema: {
          select: { description: true },
        },
      }
    });
    
    if (!relationship) {
      return NextResponse.json({ error: 'No active relationship found for the given requester, provider, and schema.' }, { status: 403 });
    }
    
    // Extract the provider's name safely from the nested query result
    const providerName = relationship.providerRole.institutions[0]?.name;
    if (!providerName) {
      // This is a sanity check in case something went wrong with the query
      return NextResponse.json({ error: 'Could not resolve provider name from relationship.' }, { status: 500 });
    }

    const dataOwner = await prisma.user.upsert({ 
        where: { externalId: dataOwnerId },
        update: {},
        create: { externalId: dataOwnerId },
        select: { id: true, fcmToken: true }
    });

    if (!dataOwner) {
        return NextResponse.json({ error: 'Could not find or create the data owner.' }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const dataRequest = await prisma.dataRequest.create({
      data: {
        requesterId: requester.id,
        providerId: providerId,
        dataOwnerId: dataOwner.id,
        dataSchemaId: dataSchemaId,
        relationshipId: relationship.id,
        status: 'AWAITING_CONSENT',
        expiresAt: expiresAt,
      },
    });

    const signature = request.headers.get('Signature');
    if (signature) {
        await prisma.dataRequestSignature.create({
            data: {
                dataRequestId: dataRequest.id,
                type: 'REQUESTER',
                signature: signature,
            },
        });
    }

    if (dataOwner.fcmToken) {
      sendConsentRequestNotification({
        fcmToken: dataOwner.fcmToken,
        requestId: dataRequest.id,
        requesterName: requester.name,
        // THE FIX (Data Access): Access the nested data correctly
        providerName: providerName,
        schemaName: relationship.dataSchema.description,
      }).catch(err => {
        console.error(`[Non-blocking Error] Failed to send push notification for request ${dataRequest.id}:`, err);
      });
    } else {
      console.warn(`User with externalId ${dataOwnerId} does not have an FCM token. Cannot send push notification.`);
    }

    return NextResponse.json({
      requestId: dataRequest.id,
      status: dataRequest.status,
      message: 'Request initiated successfully. Awaiting user consent.',
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error creating DataRequest:', err);
    if (err.code === 'P2025') { 
      return NextResponse.json({ error: 'Invalid ID provided for one or more entities.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export const POST = withM2MAuth(handler);
