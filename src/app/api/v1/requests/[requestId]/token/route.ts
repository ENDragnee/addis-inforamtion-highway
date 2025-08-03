import { NextRequest, NextResponse } from 'next/server';
import { authenticateInstitution } from '@/lib/m2m-auth';
import prisma from '@/lib/prisma';
import * as jose from 'jose';

// Helper to generate the short-lived access token for the Provider API.
// This function is correct and needs no changes.
async function createProviderAccessToken(
  requesterId: string,
  providerId: string,
  dataOwnerId: string,
  schemaId: string
): Promise<string> {
  const secret = process.env.PROVIDER_TOKEN_SECRET;
  if (!secret) {
    throw new Error('PROVIDER_TOKEN_SECRET is not set in environment variables.');
  }
  const secretKey = new TextEncoder().encode(secret);

  return await new jose.SignJWT({
    requesterId,
    providerId,
    dataOwnerId,
    schemaId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('urn:addis-information-highway:broker')
    .setAudience('urn:addis-information-highway:provider')
    .setExpirationTime('5m') // This token should be very short-lived
    .sign(secretKey);
}

export async function GET(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    // 1. Authenticate the polling institution. Only the original requester can poll.
    const { institution: requester, error: authError } = await authenticateInstitution(request);
    if (authError || !requester) {
      return authError ?? new NextResponse('Authentication failed', { status: 401 });
    }
    const { requestId } = params;

    // 2. Find the data request and verify ownership.
    // CORRECTED: Use `select` to fetch exactly the fields we need. This is more efficient
    // and solves the type mismatch bug.
    const dataRequest = await prisma.dataRequest.findFirst({
      where: {
        id: requestId,
        requesterId: requester.id,
      },
      select: {
        status: true,
        failureReason: true,
        dataOwnerId: true,
        dataSchemaId: true,
        providerId: true, // <-- Get the providerId string directly
        provider: {
          select: { apiEndpoint: true }, // <-- Get the provider's endpoint from the relation
        },
      },
    });

    if (!dataRequest) {
      return NextResponse.json({ error: 'Request not found or you are not the requester.' }, { status: 404 });
    }

    // 3. Return the current status of the request.
    const { status, failureReason } = dataRequest;

    if (status === 'APPROVED') {
      // If approved, generate the one-time access token for the provider's API
      const accessToken = await createProviderAccessToken(
        requester.id,
        dataRequest.providerId, // <-- CORRECTED: Pass the providerId string
        dataRequest.dataOwnerId,
        dataRequest.dataSchemaId
      );

      return NextResponse.json({
        status: 'APPROVED',
        providerEndpoint: dataRequest.provider.apiEndpoint, // <-- CORRECTED: Access the endpoint
        accessToken: accessToken,
      });
    }

    // For all other states, just return the status.
    return NextResponse.json({
      status: status,
      failureReason: failureReason,
    });

  } catch (error) {
    console.error(`Error polling for request status for ID ${params.requestId}:`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
