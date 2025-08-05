//@/app/api/v1/requests/[requestId]/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signPayload } from "@/lib/crypto";


interface RouteParams {
  params: Promise<{ requestId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { requestId } = await params;

    // 1. Validate requestId
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: true,
        requester: true,
        signatures: true,
      },
    });

    if (!dataRequest) {
      return NextResponse.json(
        { error: "DataRequest not found" },
        { status: 404 }
      );
    }

    // 2. Check if DataRequest is in AWAITING_CONSENT state
    if (dataRequest.status !== "AWAITING_CONSENT") {
      return NextResponse.json(
        { error: "DataRequest is not in AWAITING_CONSENT state" },
        { status: 400 }
      );
    }

    // 3. Parse and validate request body
    const bodySchema = z.object({
      consentToken: z.string(),
      consentSignature: z.string(),
    });
    const body = await request.json();
    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { consentToken, consentSignature } = parsedBody.data;
    if (!consentToken || !consentSignature) {
      return NextResponse.json(
        { error: "consentToken and consentSignature are required" },
        { status: 400 }
      );
    }

    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { consentTokenJti: consentToken, status: "APPROVED" },
    });

    const payload = {
      requestId: dataRequest.id,
      requesterId: dataRequest.requesterId,
      providerId: dataRequest.providerId,
      dataOwnerId: dataRequest.dataOwnerId,
    };

    const signature = signPayload(payload);
    const sign = await prisma.dataRequestSignature.create({
      data: {
        dataRequestId: requestId,
        type: "PLATFORM",
        signature: signature,
      },
    });
    
  } catch (err) {
    console.error("Error processing consent:", err);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
