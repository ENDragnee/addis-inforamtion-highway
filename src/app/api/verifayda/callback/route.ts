import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientAssertion } from '@/lib/esignet';
import { decodeJwt } from 'jose';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Retrieve state and code_verifier from cookies
  const cookieStore = cookies();
  const storedState = cookieStore.get('state')?.value;
  const codeVerifier = cookieStore.get('code_verifier')?.value;

  // Clean up cookies immediately
  const responseUrl = new URL('/', req.url); // Prepare base URL for redirection
  cookieStore.delete('state');
  cookieStore.delete('code_verifier');

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    responseUrl.searchParams.set('status', 'error');
    responseUrl.searchParams.set('message', 'Invalid state or verifier.');
    return NextResponse.redirect(responseUrl);
  }

  try {
    // Exchange authorization code for tokens
    const clientAssertion = await createClientAssertion();
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDIRECT_URI!,
      client_id: process.env.CLIENT_ID!,
      client_assertion: clientAssertion,
      client_assertion_type: process.env.CLIENT_ASSERTION_TYPE!,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(process.env.TOKEN_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token exchange failed');

    // Retrieve user info with the access token
    const userInfoResponse = await fetch(process.env.USERINFO_ENDPOINT!, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    if (!userInfoResponse.ok) throw new Error('Failed to fetch user info');
    
    const userInfoJwt = await userInfoResponse.text();
    const userInfo = decodeJwt(userInfoJwt);

    // Extract user data and store/update in the database
    const faydaSub = userInfo.sub;
    const email = userInfo.email as string;
    const name = userInfo.name as string;
    const picture = userInfo.picture as string;

    if (!faydaSub || !email) throw new Error('Required claims (sub, email) not found in user info');
    
    const user = await prisma.user.upsert({
      where: { faydaSub: faydaSub },
      update: { email, name, picture },
      create: { faydaSub, email, name, picture },
    });

    console.log(`User data successfully fetched/updated for ID: ${user.id}`);

    // *** KEY CHANGE: Redirect back to home with success status ***
    responseUrl.searchParams.set('status', 'success');
    responseUrl.searchParams.set('message', `User '${user.name}' was successfully synced.`);
    return NextResponse.redirect(responseUrl);

  } catch (error: any) {
    console.error('Callback handler error:', error);
    responseUrl.searchParams.set('status', 'error');
    responseUrl.searchParams.set('message', error.message || 'An internal server error occurred.');
    return NextResponse.redirect(responseUrl);
  }
}
