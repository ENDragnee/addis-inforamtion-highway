import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/cookies'; // Import our new decrypt function
import { createClientAssertion } from '@/lib/esignet';
import { SignJWT, decodeJwt } from 'jose';
import axios from 'axios';
import prisma from '@/lib/prisma';

const COOKIE_NAME = 'pkce_verifier';

// Helper function to create your app's own session token
async function createAppSessionToken(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.SESSION_PASSWORD!);
    return await new SignJWT({ sub: userId, type: 'MOBILE_USER' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Extract the authorization code from the URL query parameters.
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) throw new Error('Authorization code not found.');

    // 2. Retrieve and decrypt the code_verifier from the secure cookie. THIS IS THE FIX.
    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie) throw new Error('Session cookie not found.');
    
    const sessionData = await decrypt(cookie.value);
    const code_verifier = sessionData?.verifier;
    if (!code_verifier) throw new Error('Code verifier not found in session.');

    // 3. Perform the Token Exchange with VeriFayda.
    const clientAssertion = await createClientAssertion();
    const tokenResponse = await axios.post(
      process.env.FAYDA_TOKEN_ENDPOINT!,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.FAYDA_WEB_REDIRECT_URI!,
        client_id: process.env.FAYDA_CLIENT_ID!,
        client_assertion: clientAssertion,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        code_verifier,
      })
    );
    
    // 4. Process the user and create your app's session.
    const { id_token } = tokenResponse.data;
    if (!id_token) throw new Error('ID Token not received.');
    
    const userInfo = decodeJwt(id_token);
    const { sub: verifaydaSub, email, name, fayda_id: externalId } = userInfo;
    if (!verifaydaSub || !externalId) throw new Error('Essential info missing.');

    const user = await prisma.user.upsert({
      where: { verifaydaSub: verifaydaSub as string },
      update: { externalId: externalId as string },
      create: {
        verifaydaSub: verifaydaSub as string,
        externalId: externalId as string,
      },
    });

    const appSessionToken = await createAppSessionToken(user.id);
    const needsDeviceKeySetup = !user.devicePublicKey;

    // 5. Bridge to Flutter: Return the HTML page with the JavaScript channel.
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Complete</title>
          <script>
            function sendTokenToFlutter() {
              if (window.AuthBridge && window.AuthBridge.postMessage) {
                const data = {
                  sessionToken: "${appSessionToken}",
                  needsDeviceKeySetup: ${needsDeviceKeySetup}
                };
                window.AuthBridge.postMessage(JSON.stringify(data));
              }
            }
            window.onload = sendTokenToFlutter;
          </script>
        </head>
        <body><p>Please wait...</p></body>
      </html>
    `;

    const response = new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html' },
    });

    // 6. Delete the temporary session cookie. THIS IS THE FIX.
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0), // Set expiry to the past to delete it
        path: '/',
    });

    return response;

  } catch (error: any) {
    console.error("Callback Error:", error.message);
    const errorHtml = `
      <!DOCTYPE html><html><body><h1>Authentication Failed</h1></body></html>`;
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
