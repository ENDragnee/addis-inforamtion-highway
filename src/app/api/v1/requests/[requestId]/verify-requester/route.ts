import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { Institution } from "@/generated/prisma/client";
import { verifyLocalSignature, verifySignature } from "@/lib/crypto";

// POST /api/v1/requests/[requestId]/verify-requester
export const POST = withM2MAuth(async (req: any, res: any) => {
  try {
    const { requesterId, platformSignature, requesterSignature } = req.body;
    const { requestId } = req.params;
    const providerInstitution: Institution = req.institution;

    // 1. Validate requestId
    const requeterInstitution = await prisma.institution.findUnique({
      where: { id: requesterId },
    });

    if (!requeterInstitution) {
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
        dataSchema: true,
      },
    });

    if (!dataRequest) {
      return res
        .status(404)
        .json({ error: "DataRequest not found or does not match requester" });
    }

    // 3. Check if DataRequest is in APPROVED state
    if (dataRequest.status !== "APPROVED" || !dataRequest.consentTokenJti) {
      return res
        .status(400)
        .json({ error: "DataRequest is not in APPROVED state" });
    }

    // 4. Verify platform signature
    const payload = {
      requesterId: dataRequest.requesterId,
      providerId: dataRequest.providerId,
      dataOwnerId: dataRequest.dataOwnerId,
      relationshipId: dataRequest.relationshipId,
      expiresAt: dataRequest.expiresAt.toISOString(),
    };

    const storedPlatformSignature = dataRequest.signatures.find(
      (sig) => sig.type === SignatureType.PLATFORM
    );

    if (
      !verifyLocalSignature(payload, platformSignature) ||
      !platformSignature ||
      !storedPlatformSignature
    ) {
      return res.status(401).json({ error: "Invalid platform signature" });
    }

    // 5. Verify requester signature
    if (!requesterSignature) {
      return res.status(400).json({ error: "Missing requester signature" });
    }

    const requesterPublicKey = requeterInstitution.publicKey;
    if (!verifySignature(payload, requesterSignature, requesterPublicKey)) {
      return res.status(401).json({ error: "Invalid requester signature" });
    }

    await prisma.dataRequest.update({
      where: { id: dataRequest.id },
      data: { status: "VERIFIED" },
    });

    return NextResponse.json({
      requesterId: dataRequest.requesterId,
      Signature: dataRequest.signatures,
      consentTokenJti: dataRequest.consentTokenJti,
      providerId: dataRequest.providerId,
      dataOwnerId: dataRequest.dataOwnerId,
      relationshipId: dataRequest.relationshipId,
      expiresAt: dataRequest.expiresAt.toISOString(),
      dataSchema: dataRequest.dataSchema,
      status: dataRequest.status,
    });
  } catch (error) {
    console.error("Error verifying requester:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
