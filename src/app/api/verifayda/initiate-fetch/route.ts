// @/app/api/verifayda/initiate-fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce'; // Assuming pkce.ts exists

const generateState = () => generateCodeVerifier();

export async function GET(req: NextRequest) {
  try {
    const fin = req.nextUrl.searchParams.get('fin');
    if (!fin) {
      throw new Error('FIN (Federal ID Number) is required.');
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const claims = {
      userinfo: {
        name: { essential: true },
        email: { essential: true },
        picture: { essential: true },
      },
    };

    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.REDIRECT_URI!,
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      claims: JSON.stringify(claims),
      // IMPORTANT: Pass the FIN as a login_hint
      login_hint: `fin:${fin}`, 
    });

    const authorizationUrl = `${process.env.AUTHORIZATION_ENDPOINT}?${params.toString()}`;

    const response = NextResponse.redirect(authorizationUrl);
    
    // Set cookies on the outgoing response
    response.cookies.set('state', state, { httpOnly: true, secure: true, path: '/', maxAge: 60 * 15 });
    response.cookies.set('code_verifier', codeVerifier, { httpOnly: true, secure: true, path: '/', maxAge: 60 * 15 });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to initiate login";
    const failureUrl = new URL('/', req.url);
    failureUrl.searchParams.set('status', 'error');
    failureUrl.searchParams.set('message', errorMessage);
    return NextResponse.redirect(failureUrl);
  }
}
