//@/src/app/api/v1/mobile-auth/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { createClientAssertion } from '@/lib/esignet'; // Assuming your helper exists

// Helper to create your app's own session token for the mobile app
async function createAppSessionToken(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!); // Use a strong secret!
    return await new jose.SignJWT({ sub: userId, type: 'MOBILE_USER' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Mobile sessions can be long-lived
        .sign(secret);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get the codes from the Flutter app's request body.
    const { authorizationCode, codeVerifier } = await request.json();

    if (!authorizationCode || !codeVerifier) {
      return NextResponse.json({ error: 'Missing authorizationCode or codeVerifier' }, { status: 400 });
    }

    // 2. Create the signed JWT for client assertion.
    const clientAssertion = await createClientAssertion();

    // 3. Exchange the authorization code for tokens at VeriFayda's endpoint.
    const tokenResponse = await axios.post(
      process.env.FAYDA_TOKEN_ENDPOINT!,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        // CRITICAL: Use the MOBILE redirect URI that VeriFayda now accepts.
        redirect_uri: process.env.FAYDA_MOBILE_REDIRECT_URI!, 
        client_id: process.env.FAYDA_CLIENT_ID!,
        client_assertion: clientAssertion,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        code_verifier: codeVerifier,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // 4. Decode the ID token to get user info.
    const { id_token } = tokenResponse.data;
    if (!id_token) throw new Error('ID Token not received from provider.');
    
    const userInfo = jose.decodeJwt(id_token);
    const { sub: verifaydaSub, email, name, fayda_id: externalId } = userInfo;

    if (!verifaydaSub || !externalId) {
        return NextResponse.json({ error: 'Essential user information (sub, fayda_id) missing from ID token.' }, { status: 400 });
    }

    // 5. Find the user in your database or create a new one.
    const user = await prisma.user.upsert({
      where: { verifaydaSub: verifaydaSub as string },
      update: { externalId: externalId as string },
      create: {
        verifaydaSub: verifaydaSub as string,
        externalId: externalId as string,
      },
    });

    // 6. Create a session token for YOUR app and send it back to Flutter.
    const yourAppSessionToken = await createAppSessionToken(user.id);

    return NextResponse.json({
      message: 'Authentication successful',
      sessionToken: yourAppSessionToken,
      // Tell the app if it's the first login on this device.
      needsDeviceKeySetup: !user.fcmToken, 
    });

  } catch (error) {
    console.error('BFF Token Exchange Error:', error);
    if (axios.isAxiosError(error)) {
        return NextResponse.json({ error: 'Failed to communicate with authentication provider', details: error.response?.data }, { status: 502 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
