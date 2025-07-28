import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';
import { serialize } from 'cookie';

export async function GET(req: NextRequest) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier(); 

  // Store the code_verifier and state in a secure, httpOnly cookie
  const verifierCookie = serialize('code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });

  const stateCookie = serialize('state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });

  const claims = {
    userinfo: {
      name: { essential: true },
      email: { essential: true },
      picture: { essential: true },
      phone_number: { essential: false },
      gender: { essential: false },
      birthdate: { essential: false },
      address: { essential: false },
    },
    id_token: {},
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
  });

  const authorizationUrl = `${process.env.AUTHORIZATION_ENDPOINT}?${params.toString()}`;

  const response = NextResponse.redirect(authorizationUrl);
  // Set cookies in the response headers
  response.headers.append('Set-Cookie', verifierCookie);
  response.headers.append('Set-Cookie', stateCookie);

  return response;
}
