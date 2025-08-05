import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';
import { z } from 'zod';
import { sendConsentRequestNotification } from '@/lib/notification-service'; // Assuming this exists

// Zod schema for robust, type-safe body validation
const createRequestSchema = z.object({
  requesterId: z.string().cuid({ message: "Invalid requesterId format." }),
  providerId: z.string().cuid({ message: "Invalid providerId format." }),
  dataOwnerId: z.string().cuid({ message: "Invalid dataOwnerId format." }),
  dataSchemaId: z.string().cuid({ message: "Invalid dataSchemaId format." }),
  relationshipId: z.string().cuid({ message: "Invalid relationshipId format." }),
  expiresAt: z.string().datetime({ message: "expiresAt must be a valid ISO 8601 date string." }),
  signature: z.string().min(1, { message: "Signature cannot be empty." }),
});

// The main handler function, wrapped by our M2M auth middleware.
async function handler(request: AuthenticatedRequest) {
  // The authenticated institution is now available directly on the request object.
  const { institution } = request;

  try {
    const body = await request.json();

    // 1. Validate the request body with Zod
    const validation = createRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.format() }, { status: 400 });
    }
    const { requesterId, providerId, dataOwnerId, dataSchemaId, relationshipId, expiresAt } = validation.data;

    // 2. Perform Business Logic Validations
    // a. The requesterId in the body must match the authenticated institution's ID.
    if (requesterId !== institution.id) {
      return NextResponse.json({ error: 'Requester ID does not match authenticated institution.' }, { status: 403 });
    }

    // b. Fetch the relationship and the provider's details concurrently for efficiency.
    const [relationship, provider] = await Promise.all([
      prisma.relationship.findUnique({ where: { id: relationshipId } }),
      prisma.institution.findUnique({ where: { id: providerId }, select: { roleId: true, name: true } })
    ]);
    
    // c. Validate the existence and status of the relationship and provider.
    if (!relationship || relationship.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Relationship not found or is not active.' }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: 'Provider institution not found.' }, { status: 404 });
    }

    // d. Cross-reference the relationship with the provided IDs and roles.
    if (
      relationship.requesterRoleId !== institution.roleId ||
      relationship.providerRoleId !== provider.roleId ||
      relationship.dataSchemaId !== dataSchemaId
    ) {
      return NextResponse.json({ error: 'Provided IDs do not match the specified relationship.' }, { status: 400 });
    }

    // e. Check that the expiry date is in the future.
    if (new Date(expiresAt) <= new Date()) {
      return NextResponse.json({ error: 'The expiresAt date must be in the future.' }, { status: 400 });
    }

    // 3. Find the data owner to get their FCM token.
    const dataOwner = await prisma.user.findUnique({ 
        where: { id: dataOwnerId },
        select: { fcmToken: true }
    });

    if (!dataOwner) {
        return NextResponse.json({ error: 'Data owner not found.' }, { status: 404 });
    }

    // 4. Create the DataRequest in the database.
    const dataRequest = await prisma.dataRequest.create({
      data: {
        requesterId,
        providerId,
        dataOwnerId,
        dataSchemaId,
        relationshipId,
        status: 'AWAITING_CONSENT',
        expiresAt: new Date(expiresAt),
      },
    });

    // 5. Store the requester's signature (signature was already verified by the middleware).
    await prisma.dataRequestSignature.create({
      data: {
        dataRequestId: dataRequest.id,
        type: 'REQUESTER', // Assumes SignatureType.REQUESTER = 'REQUESTER'
        signature: validation.data.signature, // Use the validated signature
      },
    });

    // 6. Send the push notification to the user's device.
    if (dataOwner.fcmToken) {
      // "Fire and forget" the notification. The API call should not fail if the notification does.
      sendConsentRequestNotification({
        fcmToken: dataOwner.fcmToken,
        requestId: dataRequest.id,
        requesterName: institution.name,
        providerName: provider.name,
        // We need the schema description for the notification body.
        // A more optimized query would fetch this with the relationship.
        schemaName: (await prisma.dataSchema.findUnique({ where: { id: dataSchemaId } }))!.description,
      }).catch(err => {
        console.error(`[Non-blocking Error] Failed to send push notification for request ${dataRequest.id}:`, err);
      });
    } else {
      console.warn(`User with ID ${dataOwnerId} does not have an FCM token. Cannot send push notification.`);
    }

    // 7. Return a successful response to the calling institution.
    return NextResponse.json({
      requestId: dataRequest.id,
      status: dataRequest.status,
      message: 'Request initiated successfully. Awaiting user consent.',
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error creating DataRequest:', err);
    // Handle specific Prisma errors, like a foreign key constraint violation.
    if (err.code === 'P2003' || err.code === 'P2025') { 
      return NextResponse.json({ error: 'Invalid ID provided for dataOwner, provider, schema, or relationship.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// Export the wrapped handler as the POST method for this route.
export const POST = withM2MAuth(handler);
