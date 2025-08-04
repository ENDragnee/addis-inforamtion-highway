import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { signPayload } from "@/lib/utils";
import { Institution } from "@/generated/prisma/client";

// POST /api/v1/requests/[requestId]
export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const { requestId } = req.params.requestId;
    const institution: Institution = req.institution;

    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: { provider: true, signatures: true },
    });
    if (!dataRequest) {
      return res.status(404).json({ error: "DataRequest not found" });
    }
    if (
      dataRequest.requesterId !== institution.id &&
      dataRequest.providerId !== institution.id
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this DataRequest" });
    }
    if (dataRequest.status !== "APPROVED") {
      return res.status(200).json({
        requestId: dataRequest.id,
        status: dataRequest.status,
      });
    }
    const platformSignature = dataRequest.signatures.find(
        (sig) => sig.type === SignatureType.PLATFORM
      );

    if (
      dataRequest.consentTokenJti &&
      dataRequest.expiresAt > new Date() &&
      dataRequest.status === "APPROVED" &&
      platformSignature
    ) {

      return NextResponse.json({
        requestId: dataRequest.id,
        status: dataRequest.status,
        platformSignature: platformSignature.signature,
        providerEndpoint: dataRequest.provider.apiEndpoint,
      });
    }
  } catch (err) {
    console.error("Error getting request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
