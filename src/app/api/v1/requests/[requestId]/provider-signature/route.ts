import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canonicalizeBody, withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import {
  verifySignature,
} from "@/lib/crypto";
import { Institution } from "@/generated/prisma/client";

// POST /api/v1/requests/[requestId]/provider-signature
export const POST = withM2MAuth(async (req: any, res: any) => {
  try {
    const { requesterId, dataSignature, dataHash } = req.body;
    const { requestId } = req.params;
    const providerInstitution: Institution = req.institution;

    // 1. Validate requestId
    const requesterInstitution = await prisma.institution.findUnique({
      where: { id: requesterId },
    });
    if (!requesterInstitution) {
      return res.status(404).json({ error: "Requester institution not found" });
    }
    // 2. Fetch DataRequest
    const dataRequest = await prisma.dataRequest.findUnique({
      where: {
        id: requestId,
        requesterId: requesterId,
        providerId: providerInstitution.id,
      },
      include: {
        provider: true,
        requester: true,
        signatures: true,
      },
    });

    if (!dataRequest) {
      return res
        .status(404)
        .json({ error: "DataRequest not found or does not match requester" });
    }

    // 3. Check if DataRequest is in APPROVED state
    if (dataRequest.status !== "VERIFIED" || !dataRequest.consentTokenJti) {
      return res
        .status(400)
        .json({ error: "DataRequest is not in APPROVED state" });
    }

    // 4. Verify prover signature
    const payload = {
      requesterId: dataRequest.requesterId,
      providerId: dataRequest.providerId,
      dataOwnerId: dataRequest.dataOwnerId,
      relationshipId: dataRequest.relationshipId,
      expiresAt: dataRequest.expiresAt.toISOString(),
    };
    if (
      !dataSignature ||
      !verifySignature(payload, dataSignature, providerInstitution.publicKey)
    ) {
      return res.status(400).json({ error: "Invalid provider signature" });
    }

    if (!dataHash) {
      return res.status(400).json({ error: "Invalid data hash" });
    }

    // 5. Create provider signature
    const providerSignature = await prisma.dataRequestSignature.create({
      data: {
        type: SignatureType.PROVIDER,
        signature: dataSignature,
        dataRequest: { connect: { id: requestId } },
      },
    });

    // 6. Update DataRequest status to DELIVERED
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: "DELIVERED", dataHash: dataHash },
    });

    // 7. Return response

    return NextResponse.json({
      requestId: dataRequest.id,
      status: "DELIVERED",
    });
  } catch (error) {
    console.error("Error verifying requester:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
