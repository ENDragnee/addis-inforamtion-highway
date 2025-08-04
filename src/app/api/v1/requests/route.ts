import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth } from '@/lib/m2m-auth';
import { createDataRequest } from '@/services/dataRequestService';
import { SignatureType } from '@/types/DataRequest';

// POST /api/v1/requests
export const POST = withM2MAuth(async (req: any, res: any) => {
  try {
    const institution = req.institution; // set by withM2MAuth
    const body = req.body;
    const {
      requesterId,
      providerId,
      dataOwnerId,
      dataSchemaId,
      relationshipId,
      expiresAt,
    } = body;

    // 1. requesterId must match authenticated institution
    if (requesterId !== institution.id) {
      return res.status(403).json({ error: 'Requester does not match authenticated institution' });
    }

    // 2. Validate relationship
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: { requesterRole: true, providerRole: true, dataSchema: true },
    });
    if (!relationship || relationship.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Relationship not found or not active' });
    }
    if (
      relationship.requesterRoleId !== institution.roleId ||
      relationship.providerRoleId !== (await prisma.institution.findUnique({ where: { id: providerId } }))?.roleId ||
      relationship.dataSchemaId !== dataSchemaId
    ) {
      return res.status(400).json({ error: 'Relationship does not match requester/provider/dataSchema' });
    }

    // 3. Check expiry
    if (!expiresAt || new Date(expiresAt) <= new Date()) {
      return res.status(400).json({ error: 'expiresAt must be in the future' });
    }

    // 4. Create DataRequest
    const status = 'AWAITING_CONSENT';
    const dataRequest = await createDataRequest({
      requester: { connect: { id: requesterId } },
      provider: { connect: { id: providerId } },
      dataOwner: { connect: { id: dataOwnerId } },
      dataSchema: { connect: { id: dataSchemaId } },
      relationship: { connect: { id: relationshipId } },
      status,
      expiresAt: new Date(expiresAt),
    });

    // 5. Optionally, store the requester's signature (already verified by m2m-auth)
     await prisma.dataRequestSignature.create({
      data: {
        dataRequestId: dataRequest.id,
        type: SignatureType.REQUESTER,
        signature: req.headers['signature'],
      },
    });

    // 6. Return response
    return res.status(201).json({
      requestId: dataRequest.id,
      status: dataRequest.status,
      nextSteps: 'Awaiting user consent',
    });
  } catch (err) {
    console.error('Error creating DataRequest:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
