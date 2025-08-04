import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canonicalizeBody, withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import {
  verifySignature,
} from "@/lib/crypto";
import { Institution } from "@/generated/prisma/client";

// POST /api/v1/requests/[requestId]/requester-signature
export const POST = withM2MAuth(async (req: any, res: any) => {
  try {
    const { providerId, providerSignature, platformSignature, requesterSignature } = req.body;
    const { requestId } = req.params;
    const requesterInstitution: Institution = req.institution;

    // 1. Validate requestId
    const providerInstitution = await prisma.institution.findUnique({
      where: { id: providerId },
    });

    if (!providerInstitution) {
        return res.status(404).json({ error: "Provider institution not found" });
    }

    // 2. Fetch DataRequest
    const dataRequest = await prisma.dataRequest.findUnique({
      where: {
        id: requestId,
        requesterId: requesterInstitution.id,
        providerId: providerId,
      },
        include: {
        provider: true,
        requester: true,
        signatures: true,
        dataSchema: true,
      },
    });

    if (!dataRequest) {
      return res
        .status(404)
        .json({ error: "DataRequest not found or does not match requester" });
    }

    // 3. Check if DataRequest is in DELIVERED state
    if (dataRequest.status !== "DELIVERED" || !dataRequest.consentTokenJti) {
      return res
        .status(400)
        .json({ error: "DataRequest is not in DELIVERED state" });
    }   

    // 4. Verify platform signature
    const payload = {
      requesterId: dataRequest.requesterId,
      providerId: dataRequest.providerId,
      dataOwnerId: dataRequest.dataOwnerId,
      relationshipId: dataRequest.relationshipId,
      expiresAt: dataRequest.expiresAt.toISOString(),
    };

    if (
      !platformSignature ||
      !verifySignature(payload, platformSignature, providerInstitution.publicKey)
    ) {
      return res.status(400).json({ error: "Invalid platform signature" });
    }

    // 5. Verify provider signature
    if (
      !providerSignature ||
      !verifySignature(payload, providerSignature, providerInstitution.publicKey)
    ) {
      return res.status(400).json({ error: "Invalid provider signature" });
    }

    // 6. Verify requester signature
    if (!requesterSignature ||
      !verifySignature(payload, requesterSignature, requesterInstitution.publicKey)) {
      return res.status(400).json({ error: "Invalid requester signature" });
    }

    // 7. Create requester signature
    const requesterSignatureRecord = await prisma.dataRequestSignature.create({
      data: {
        type: SignatureType.REQUESTER,
        signature: requesterSignature,
        dataRequest: { connect: { id: requestId } },
      },
    });

    // 8. Update DataRequest status to COMPLETED
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    // 8.5 send a push notification to the user 

    // 9. Return response
    return NextResponse.json({
        requestId: dataRequest.id,
        status: "COMPLETED",
    });

  } catch (err) {
    console.error("Error processing provider signature:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});