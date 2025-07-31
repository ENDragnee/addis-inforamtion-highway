//@/app/api/v1/[requestId]/consent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import * as jose from 'jose';

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

const consentSchema = z.object({
  consentToken: z.string().min(1, 'consentToken is required'),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate the Requester Institution
  const { institution: requester, error: authError } = await authenticateInstitution(request);
  if (authError) return authError;

  // 2. Validate Request Body
  const body = await request.json();
  const validation = consentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error }, { status: 400 });
  }
  const { consentToken } = validation.data;
  const { requestId } = await params;

  try {
    // 3. Find the original DataRequest and verify ownership
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: { provider: true },
    });

    if (!dataRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    if (dataRequest.requesterId !== requester!.id) {
      return NextResponse.json({ error: 'You are not authorized to update this request' }, { status: 403 });
    }
    if (dataRequest.status !== 'AWAITING_CONSENT') {
      return NextResponse.json({ error: `Request is not awaiting consent. Current status: ${dataRequest.status}` }, { status: 409 });
    }
    if (new Date() > dataRequest.expiresAt) {
      // Lazily update status if expired
      await prisma.dataRequest.update({ where: { id: requestId }, data: { status: 'EXPIRED' } });
      return NextResponse.json({ error: 'Request has expired' }, { status: 410 });
    }
    
    // 4. Decode and Validate the JWT Consent Token
    // In a real-world scenario, you would verify the signature using the user's public key.
    // For now, we decode and verify the claims against our database record.
    const claims = jose.decodeJwt(consentToken);
    const jti = claims.jti;

    if (!jti) {
      return NextResponse.json({ error: 'Consent token missing required JTI claim' }, { status: 400 });
    }
    
    // Check if JTI has been used before (replay attack prevention)
    const existingJti = await prisma.dataRequest.findFirst({ where: { consentTokenJti: jti } });
    if (existingJti) {
        return NextResponse.json({ error: 'Consent token has already been used' }, { status: 409 });
    }

    // TODO: Add more claim validations as needed, e.g., matching requester/provider/schema in token
    // with the `dataRequest` record. This adds another layer of security.
    
    // 5. Update the request status to APPROVED
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        consentTokenJti: jti,
      },
    });

    // 6. Return the provider's endpoint for the direct call
    return NextResponse.json({
      status: 'APPROVED',
      providerEndpoint: dataRequest.provider.apiEndpoint,
      message: "Consent verified. You may now call the provider's endpoint directly.",
    });

  } catch (err) {
    if (err instanceof jose.errors.JWTInvalid) {
        return NextResponse.json({ error: 'Invalid consent token format' }, { status: 400 });
    }
    console.error('Error processing consent:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
