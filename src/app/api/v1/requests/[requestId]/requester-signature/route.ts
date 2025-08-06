import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth, AuthenticatedRequest } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { verifySignature } from "@/lib/crypto";
import { Institution } from "@/generated/prisma/client";

export const POST = withM2MAuth(
  async (req: AuthenticatedRequest, { params }: { params: { requestId: string } }) => {
    try {
      const requestId = await params.requestId;
      const requesterInstitution: Institution = req.institution;
      const body = await req.json();

      const {
        providerId,
        providerSignature,
        platformSignature,
        requesterSignature,
      } = body;

      if (!providerId || !platformSignature || !providerSignature || !requesterSignature) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // 1. Fetch provider institution
      const providerInstitution = await prisma.institution.findUnique({
        where: { id: providerId },
      });

      if (!providerInstitution) {
        return NextResponse.json({ error: "Provider institution not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "DataRequest not found or does not match requester" },
          { status: 404 }
        );
      }

      // 3. Validate request status
      if (dataRequest.status !== "DELIVERED" || !dataRequest.consentTokenJti) {
        return NextResponse.json(
          { error: "DataRequest is not in DELIVERED state" },
          { status: 400 }
        );
      }

      // 4. Canonical payload to verify signatures
      const payload = {
        requesterId: dataRequest.requesterId,
        providerId: dataRequest.providerId,
        dataOwnerId: dataRequest.dataOwnerId,
        relationshipId: dataRequest.relationshipId,
        expiresAt: dataRequest.expiresAt.toISOString(),
      };

      // 5. Verify signatures
      const isPlatformSigValid = verifySignature(
        payload,
        platformSignature,
        providerInstitution.publicKey
      );
      const isProviderSigValid = verifySignature(
        payload,
        providerSignature,
        providerInstitution.publicKey
      );
      const isRequesterSigValid = verifySignature(
        payload,
        requesterSignature,
        requesterInstitution.publicKey
      );

      if (!isPlatformSigValid) {
        return NextResponse.json({ error: "Invalid platform signature" }, { status: 400 });
      }
      if (!isProviderSigValid) {
        return NextResponse.json({ error: "Invalid provider signature" }, { status: 400 });
      }
      if (!isRequesterSigValid) {
        return NextResponse.json({ error: "Invalid requester signature" }, { status: 400 });
      }

      // 6. Save requester signature
      await prisma.dataRequestSignature.create({
        data: {
          type: SignatureType.REQUESTER,
          signature: requesterSignature,
          dataRequest: { connect: { id: requestId } },
        },
      });

      // 7. Update status to COMPLETED
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED" },
      });

      // TODO: 8.5 send push notification to user (implement as needed)

      // 9. Return response
      return NextResponse.json({
        requestId: dataRequest.id,
        status: "COMPLETED",
      });
    } catch (err) {
      console.error("Error processing requester signature:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
