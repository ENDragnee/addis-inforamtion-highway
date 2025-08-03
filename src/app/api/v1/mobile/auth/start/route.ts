import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';
import { encrypt } from '@/lib/cookies'; // Import our new encrypt function

const COOKIE_NAME = 'pkce_session';

export async function GET(request: NextRequest) {
  try {
    // 1. Generate the PKCE codes for this authentication flow.
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    // 2. Encrypt the verifier to be stored in the cookie.
    const encryptedVerifier = await encrypt({ verifier });

    // 3. Construct the VeriFayda authorization URL.
    const authUrl = new URL(process.env.FAYDA_AUTHORIZATION_ENDPOINT!);
    authUrl.searchParams.append('client_id', process.env.FAYDA_CLIENT_ID!);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', process.env.FAYDA_WEB_REDIRECT_URI!);
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // 4. Create a redirect response.
    const response = NextResponse.redirect(authUrl.toString());

    // 5. Set the secure, httpOnly cookie on the response. THIS IS THE FIX.
    response.cookies.set(COOKIE_NAME, encryptedVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes, matching the JWT expiry
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Auth start error:", error);
    return new NextResponse('Authentication initiation failed.', { status: 500 });
  }
}
