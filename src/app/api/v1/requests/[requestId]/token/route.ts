import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import * as jose from 'jose';

interface RouteContext {
  params: { requestId: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { institution, error: authError } = await authenticateInstitution(request);
  if (authError || !institution) return authError ?? new NextResponse('Authentication failed', { status: 401 });

  try {
    const { requestId } = params;
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: { provider: true, dataSchema: true },
    });

    if (!dataRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (dataRequest.requesterId !== institution.id) return NextResponse.json({ error: 'Not authorized for this request' }, { status: 403 });

    if (dataRequest.status === 'APPROVED') {
      if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error('JWT_ACCESS_SECRET is not set in environment variables.');
      }

      // Generate a new, short-lived "Access Token" that the Provider will accept.
      // This token proves that the middleman has validated the user's consent.
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      const accessToken = await new jose.SignJWT({ 
          requestId: dataRequest.id,
          requesterId: dataRequest.requesterId,
          providerId: dataRequest.providerId,
          schemaId: dataRequest.dataSchema.schemaId,
          fields: dataRequest.requestedFields, // Pass the fields the provider should return
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:trustbroker:platform') // Your platform's identifier
        .setAudience('urn:trustbroker:provider') // Intended for providers
        .setExpirationTime('5m') // This token is only valid for 5 minutes
        .sign(secret);

      return NextResponse.json({
        status: 'APPROVED',
        providerEndpoint: dataRequest.provider.apiEndpoint,
        accessToken,
      });
    }

    // For all other statuses, just report the current status.
    return NextResponse.json({
      status: dataRequest.status,
      failureReason: dataRequest.failureReason,
    });

  } catch (err) {
    console.error('Error fetching request token:', err);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
