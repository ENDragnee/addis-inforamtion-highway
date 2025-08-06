import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth, AuthenticatedRequest } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { Institution } from "@/generated/prisma/client";
import { verifyLocalSignature, verifySignature } from "@/lib/crypto";

// POST /api/v1/requests/[requestId]/verify-requester
export const POST = withM2MAuth(
  async (req: AuthenticatedRequest, { params }: { params: { requestId: string } }) => {
    try {
      const requestId = await params.requestId;
      const providerInstitution: Institution = req.institution;

      const body = await req.json();
      const { requesterId, platformSignature, requesterSignature } = body;

      if (!requesterId || !platformSignature || !requesterSignature) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // 1. Validate requester institution
      const requesterInstitution = await prisma.institution.findUnique({
        where: { id: requesterId },
      });

      if (!requesterInstitution) {
        return NextResponse.json({ error: "Requester institution not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "DataRequest not found or does not match requester" },
          { status: 404 }
        );
      }

      // 3. Check if DataRequest is in APPROVED state and has consent
      if (dataRequest.status !== "APPROVED" || !dataRequest.consentTokenJti) {
        return NextResponse.json(
          { error: "DataRequest is not in APPROVED state" },
          { status: 400 }
        );
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
        !platformSignature ||
        !storedPlatformSignature ||
        !verifyLocalSignature(payload, platformSignature)
      ) {
        return NextResponse.json({ error: "Invalid platform signature" }, { status: 401 });
      }

      // 5. Verify requester signature using their public key
      const requesterPublicKey = requesterInstitution.publicKey;

      if (
        !verifySignature(
          requesterInstitution.clientId,
          requesterSignature,
          requesterPublicKey
        )
      ) {
        return NextResponse.json({ error: "Invalid requester signature" }, { status: 401 });
      }

      // 6. Update status to VERIFIED
      await prisma.dataRequest.update({
        where: { id: dataRequest.id },
        data: { status: "VERIFIED" },
      });

      // 7. Return final response
      return NextResponse.json({
        requesterId: dataRequest.requesterId,
        signatures: dataRequest.signatures,
        consentTokenJti: dataRequest.consentTokenJti,
        providerId: dataRequest.providerId,
        dataOwnerId: dataRequest.dataOwnerId,
        relationshipId: dataRequest.relationshipId,
        expiresAt: dataRequest.expiresAt.toISOString(),
        dataSchema: dataRequest.dataSchema,
        status: "VERIFIED",
      });
    } catch (error) {
      console.error("Error verifying requester:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
