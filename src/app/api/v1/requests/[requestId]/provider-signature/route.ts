import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withM2MAuth, AuthenticatedRequest } from "@/lib/m2m-auth";
import { SignatureType } from "@/types/DataRequest";
import { verifySignature } from "@/lib/crypto";
import { Institution } from "@/generated/prisma/client";

// POST /api/v1/requests/[requestId]/provider-signature
export const POST = withM2MAuth(
  async (req: AuthenticatedRequest, { params }: { params: { requestId: string } }) => {
    try {
      const requestId = await params.requestId;
      const providerInstitution: Institution = req.institution;
      const body = await req.json();

      const { requesterId, dataSignature, dataHash } = body;

      if (!requesterId || !dataSignature || !dataHash) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // 1. Validate requester institution
      const requesterInstitution = await prisma.institution.findUnique({
        where: { id: requesterId },
      });

      if (!requesterInstitution) {
        return NextResponse.json(
          { error: "Requester institution not found" },
          { status: 404 }
        );
      }

      // 2. Fetch DataRequest
      const dataRequest = await prisma.dataRequest.findUnique({
        where: {
          id: requestId,
          requesterId,
          providerId: providerInstitution.id,
        },
        include: {
          provider: true,
          requester: true,
          signatures: true,
        },
      });

      if (!dataRequest) {
        return NextResponse.json(
          { error: "DataRequest not found or does not match requester" },
          { status: 404 }
        );
      }

      // 3. Validate status
      if (dataRequest.status !== "VERIFIED" || !dataRequest.consentTokenJti) {
        return NextResponse.json(
          { error: "DataRequest is not in VERIFIED state" },
          { status: 400 }
        );
      }

      // 4. Construct payload & verify provider signature
      const payload = {
        requesterId: dataRequest.requesterId,
        providerId: dataRequest.providerId,
        dataOwnerId: dataRequest.dataOwnerId,
        relationshipId: dataRequest.relationshipId,
        expiresAt: dataRequest.expiresAt.toISOString(),
      };

      const isValidProviderSignature = verifySignature(
        payload,
        dataSignature,
        providerInstitution.publicKey
      );

      if (!isValidProviderSignature) {
        return NextResponse.json(
          { error: "Invalid provider signature" },
          { status: 400 }
        );
      }

      // 5. Save provider signature
      await prisma.dataRequestSignature.create({
        data: {
          type: SignatureType.PROVIDER,
          signature: dataSignature,
          dataRequest: { connect: { id: requestId } },
        },
      });

      // 6. Update status to DELIVERED
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: "DELIVERED",
          dataHash,
        },
      });

      // 7. Return result
      return NextResponse.json({
        requestId: dataRequest.id,
        status: "DELIVERED",
      });
    } catch (error) {
      console.error("Error processing provider signature:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
