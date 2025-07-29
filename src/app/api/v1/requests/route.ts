import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma'; // Make sure this path is correct
import { authenticateInstitution } from '@/lib/m2m-auth'; // Make sure this path is correct

// Zod schema for request body validation
const createRequestSchema = z.object({
  // FIXED: The correct way to enforce a required string.
  ownerExternalId: z.string().min(1, { message: "ownerExternalId is required" }),
  schemaId: z.string().min(1, { message: "schemaId is required" }),
  
  // FIXED: Chained .cuid() for format validation. A CUID is inherently non-empty.
  providerId: z.string().cuid({ message: "Invalid providerId format" }),

  expiresIn: z.number().int().positive().optional().default(3600),
});

export async function POST(request: NextRequest) {
  // 1. Authenticate the Requester Institution
  const { institution: requester, error: authError } = await authenticateInstitution(request);
  if (authError || !requester) return authError ?? new NextResponse('Authentication failed', { status: 401 });

  // 2. Validate Request Body
  const body = await request.json();
  const validation = createRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
  }
  const { ownerExternalId, schemaId, providerId, expiresIn } = validation.data;
  
  try {
    // 3. Perform RBAC check using the Relationship "Rulebook"
    const [provider, schema] = await Promise.all([
      prisma.institution.findUnique({ where: { id: providerId } }),
      prisma.dataSchema.findUnique({ where: { schemaId } }),
    ]);
    
    if (!provider || !schema) {
      return NextResponse.json({ error: 'Invalid providerId or schemaId' }, { status: 404 });
    }

    // This query now works because you fixed the schema in Step 1.
    const relationship = await prisma.relationship.findFirst({
      where: {
        requesterRole: { institutions: { some: { id: requester.id } } },
        providerRole: { institutions: { some: { id: providerId } } },
        dataSchema: { schemaId },
        status: 'ACTIVE',
      },
    });
    
    if (!relationship) {
      return NextResponse.json({ error: 'This request is not permitted by the established rules, or the relationship is not active' }, { status: 403 });
    }

    // 4. Find or create the data owner (User)
    const dataOwner = await prisma.user.upsert({
      where: { externalId: ownerExternalId },
      update: {},
      create: { externalId: ownerExternalId },
    });
    
    // 5. Create the DataRequest record
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

    // TODO: Trigger notification to the user's wallet app
    console.log(`Notification for user: ${dataOwner.id}, request: ${dataRequest.id}`);

    // 6. Respond with 'Accepted'
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
