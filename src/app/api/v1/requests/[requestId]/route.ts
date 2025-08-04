import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { Institution } from "@/types/Institution";
import { signPayload } from "@/lib/utils";


// POST /api/v1/requests/[requestId]
export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const { requestId } = req.params.requestId;
    const institution: Institution = req.institution;

    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: { provider: true },
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

    if (
      dataRequest.consentTokenJti &&
      dataRequest.expiresAt > new Date() &&
      dataRequest.status === "APPROVED"
    ) {
      // Sign the data request
      const payload = {
        requestId: dataRequest.id,
        requesterId: dataRequest.requesterId,
        providerId: dataRequest.providerId,
        dataOwnerId: dataRequest.dataOwnerId,
        relationshipId: dataRequest.relationshipId,
        issuedAt: new Date().toISOString(),
        expiresAt: dataRequest.expiresAt.toISOString(),
      };

      let signatureRow = await prisma.dataRequestSignature.findFirst({
        where: {
          dataRequestId: dataRequest.id,
          type: SignatureType.PLATFORM,
        },
      });

      if (!signatureRow) {
        const signature = await signPayload(payload);
        signatureRow = await prisma.dataRequestSignature.create({
          data: {
            dataRequestId: dataRequest.id,
            type: SignatureType.PLATFORM,
            signature: signature,
          },
        });
      }

      return NextResponse.json({
        requestId: dataRequest.id,
        status: dataRequest.status,
        providerEndpoint: dataRequest.provider.apiEndpoint,
      });
    }
  } catch (err) {
    console.error("Error getting request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
