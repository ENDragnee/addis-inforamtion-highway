//@/app/api/v1/mobile/requests/[requestId]/respond/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch (e) {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId } = await params;
    const { action, consentToken } = await request.json(); // action: 'APPROVE' | 'DENY'

    const dataRequest = await prisma.dataRequest.findFirst({
      where: { id: requestId, dataOwnerId: userId },
      include: { dataOwner: true },
    });

    if (!dataRequest) {
      return NextResponse.json({ error: 'Request not found or you are not authorized' }, { status: 404 });
    }
    if (dataRequest.status !== 'AWAITING_CONSENT') {
      return NextResponse.json({ error: 'This request is no longer awaiting consent.' }, { status: 409 });
    }

    if (action === 'DENY') {
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: 'DENIED' },
      });
      return NextResponse.json({ message: 'Request denied successfully.' });
    }

    if (action === 'APPROVE') {
      if (!consentToken) {
        return NextResponse.json({ error: 'Consent token is required for approval.' }, { status: 400 });
      }

      // 1. Verify the consent token signature using the user's stored public key
      const publicKeyJwk = JSON.parse(dataRequest.dataOwner.fcmToken!);
      const publicKey = await jose.importJWK(publicKeyJwk, 'ES256');
      const { payload } = await jose.jwtVerify(consentToken, publicKey);
      
      // 2. Perform replay attack check
      const jti = payload.jti;
      if (!jti) return NextResponse.json({ error: 'Token missing JTI' }, { status: 400 });
      const existingJti = await prisma.dataRequest.findFirst({ where: { consentTokenJti: jti } });
      if (existingJti) return NextResponse.json({ error: 'Token already used' }, { status: 409 });

      // 3. Update the request to APPROVED
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', consentTokenJti: jti },
      });
      
      // 4. TODO: Notify the original institution that consent is granted.
      // (This could be a webhook call, a message queue entry, etc.)
      console.log(`Consent granted for request ${requestId}. Notifying institution...`);
      
      return NextResponse.json({ message: 'Request approved successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error('Consent response error:', error);
    if (error instanceof jose.errors.JOSEError) {
      return NextResponse.json({ error: 'Invalid consent token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
