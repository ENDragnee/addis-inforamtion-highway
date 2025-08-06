import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthenticatedRequest, withM2MAuth } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { Institution } from "@/generated/prisma/client";

export const GET = withM2MAuth(
  async (req: AuthenticatedRequest, { params }: { params: { requestId: string } }) => {
    try {
      const { requestId } = await params;
      const institution: Institution = req.institution;

      const dataRequest = await prisma.dataRequest.findUnique({
        where: { id: requestId },
        include: { provider: true, signatures: true },
      });

      if (!dataRequest) {
        return NextResponse.json({ error: "DataRequest not found" }, { status: 404 });
      }

      if (
        dataRequest.requesterId !== institution.id &&
        dataRequest.providerId !== institution.id
      ) {
        return NextResponse.json(
          { error: "Unauthorized access to this DataRequest" },
          { status: 403 }
        );
      }

      if (dataRequest.status !== "APPROVED") {
        return NextResponse.json({
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
        platformSignature
      ) {
        return NextResponse.json({
          requestId: dataRequest.id,
          status: dataRequest.status,
          platformSignature: platformSignature.signature,
          providerEndpoint: dataRequest.provider.apiEndpoint,
        });
      }

      // If status is APPROVED but conditions not met
      return NextResponse.json({
        requestId: dataRequest.id,
        status: dataRequest.status,
      });
    } catch (err) {
      console.error("Error getting request:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
