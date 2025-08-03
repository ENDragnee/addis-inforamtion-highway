//@/src/app/api/v1/mobile-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

// --- Configuration read from environment variables ---
const FAYDA_TOKEN_ENDPOINT = process.env.FAYDA_TOKEN_ENDPOINT!;
const FAYDA_CLIENT_ID = process.env.FAYDA_CLIENT_ID!;
// THIS IS THE CRITICAL VARIABLE WE NEED
const FAYDA_MOBILE_REDIRECT_URI = process.env.FAYDA_MOBILE_REDIRECT_URI!; 
const FAYDA_ISSUER = `https://${new URL(process.env.FAYDA_AUTHORIZATION_ENDPOINT!).hostname}`;
const CLIENT_PRIVATE_KEY_JWK = JSON.parse(process.env.FAYDA_PRIVATE_KEY!);

// Function to create the client assertion JWT (no changes needed here)
async function createClientAssertion() {
  const privateKey = await jose.importJWK(CLIENT_PRIVATE_KEY_JWK, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  return await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: CLIENT_PRIVATE_KEY_JWK.kid })
    .setSubject(FAYDA_CLIENT_ID)
    .setIssuer(FAYDA_CLIENT_ID)
    .setAudience(FAYDA_TOKEN_ENDPOINT)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey);
}

export async function POST(request: NextRequest) {
try {
    const { authorizationCode, codeVerifier } = await request.json();
    if (!authorizationCode || !codeVerifier) {
      return NextResponse.json({ error: 'Missing required codes' }, { status: 400 });
    }

    const clientAssertion = await createClientAssertion();

    const tokenResponse = await axios.post(
      process.env.FAYDA_TOKEN_ENDPOINT!,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: process.env.FAYDA_MOBILE_REDIRECT_URI!,
        client_id: process.env.FAYDA_CLIENT_ID!,
        client_assertion: clientAssertion,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        code_verifier: codeVerifier,
      })
    );
    
    const { id_token } = tokenResponse.data;
    if (!id_token) throw new Error('ID Token not received');

    const userInfo = jose.decodeJwt(id_token);
    const { sub: verifaydaSub, email, name, fayda_id: externalId } = userInfo;
    if (!verifaydaSub || !externalId) {
      return NextResponse.json({ error: 'Essential user info missing' }, { status: 400 });
    }

    // Upsert the user but without any password logic
    const user = await prisma.user.upsert({
      where: { verifaydaSub: verifaydaSub as string },
      update: { externalId: externalId as string },
      create: {
        verifaydaSub: verifaydaSub as string,
        externalId: externalId as string,
        // HashedPassword is no longer relevant for the mobile flow
      },
    });

    const yourAppSessionToken = await createAppSessionToken(user.id);

    return NextResponse.json({
      message: 'Authentication successful',
      sessionToken: yourAppSessionToken,
      // The new flag now indicates if the device key needs to be set up
      needsDeviceKeySetup: !user.fcmToken,
    });

  } catch (error) {
    console.error('BFF Token Exchange Error:', error);
    if (axios.isAxiosError(error)) {
        // This is where the "invalid redirect_uri" error from VeriFayda would have been caught
        return NextResponse.json({ error: 'Failed to communicate with authentication provider', details: error.response?.data }, { status: 502 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

async function createAppSessionToken(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    return await new jose.SignJWT({ sub: userId, type: 'MOBILE_USER' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}
