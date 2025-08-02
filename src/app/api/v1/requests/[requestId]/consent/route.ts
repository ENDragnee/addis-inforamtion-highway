import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import * as jose from 'jose';

// Helper function to compare arrays regardless of order
const areArraysEqual = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

const consentSchema = z.object({
  consentToken: z.string().min(1, 'consentToken is required'),
});

export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  // This endpoint can be called by a trusted party (like the wallet app backend)
  // or the requester forwarding the token. We authenticate the requester here.
  const { institution: requester, error: authError } = await authenticateInstitution(request);
  if (authError || !requester) return authError ?? new NextResponse('Authentication failed', { status: 401 });

  const body = await request.json();
  const validation = consentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
  }
  const { consentToken } = validation.data;
  const { requestId } = params;

  try {
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!dataRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (dataRequest.requesterId !== requester.id) return NextResponse.json({ error: 'Not authorized for this request' }, { status: 403 });
    if (dataRequest.status !== 'AWAITING_CONSENT') return NextResponse.json({ error: `Request not awaiting consent. Status: ${dataRequest.status}` }, { status: 409 });

    // TODO: CRITICAL - Verify the JWT signature using the user's public key.
    // This requires a system to manage user public keys.
    // For now, we decode and verify claims.
    const claims = jose.decodeJwt(consentToken) as any;
    const { jti, fields: consentedFields } = claims;
    
    if (!jti) return NextResponse.json({ error: 'Consent token missing JTI' }, { status: 400 });
    
    // CRUCIAL VALIDATION: Ensure the user consented to exactly what was requested.
    const originallyRequestedFields = (dataRequest.requestedFields as string[] | null) || [];
    if (!areArraysEqual(consentedFields || [], originallyRequestedFields)) {
      await prisma.dataRequest.update({ where: { id: requestId }, data: { status: 'FAILED', failureReason: 'Consent fields mismatch' }});
      return NextResponse.json({ error: 'The fields in the consent token do not match the original request.' }, { status: 400 });
    }

    const existingJti = await prisma.dataRequest.findFirst({ where: { consentTokenJti: jti } });
    if (existingJti) return NextResponse.json({ error: 'Consent token has already been used' }, { status: 409 });
    
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        consentTokenJti: jti,
      },
    });

    return NextResponse.json({ status: 'APPROVED', message: 'Consent verified and accepted.' });

  } catch (err) {
    console.error('Error processing consent:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
