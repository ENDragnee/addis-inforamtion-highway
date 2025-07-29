// src/app/api/verifayda/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientAssertion } from '@/lib/esignet';
import { decodeJwt } from 'jose';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Prepare the base URL for redirection in all cases (success or error)
  const responseUrl = new URL('/', req.nextUrl); 
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateFromParams = searchParams.get('state');

    // FIX: This is the correct way to read from the read-only cookie store.
    const cookieStore = cookies();
    const storedState = cookieStore.get('state')?.value;
    const codeVerifier = cookieStore.get('code_verifier')?.value;

    if (!code || !stateFromParams || !storedState || stateFromParams !== storedState || !codeVerifier) {
      throw new Error('Invalid state, code, or verifier. Please try logging in again.');
    }

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
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }

    // Retrieve user info with the access token
    const userInfoResponse = await fetch(process.env.USERINFO_ENDPOINT!, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from provider.');
    }
    
    const userInfoJwt = await userInfoResponse.text();
    const userInfo = decodeJwt(userInfoJwt);

    const faydaSub = userInfo.sub as string;
    const email = userInfo.email as string;
    const name = userInfo.name as string;
    const picture = userInfo.picture as string;

    if (!faydaSub || !email) {
      throw new Error('Required claims (sub, email) not found in user info.');
    }
    
    // Store/update user info in your database
    const user = await prisma.user.upsert({
      where: { faydaSub },
      update: { email, name, picture },
      create: { faydaSub, email, name, picture },
    });

    console.log(`User data successfully stored for ID: ${user.id}`);

    // Create a success response and redirect
    responseUrl.searchParams.set('status', 'success');
    responseUrl.searchParams.set('message', `Successfully authenticated ${user.name}`);
    const response = NextResponse.redirect(responseUrl);

    // FIX: Clean up cookies on the *outgoing response*
    response.cookies.delete('state');
    response.cookies.delete('code_verifier');
    
    return response;

  } catch (error: unknown) {
    console.error('Callback handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
    
    responseUrl.searchParams.set('status', 'error');
    responseUrl.searchParams.set('message', errorMessage);
    const response = NextResponse.redirect(responseUrl);

    // FIX: Also clean up cookies on failure to prevent stale data
    response.cookies.delete('state');
    response.cookies.delete('code_verifier');
    
    return response;
  }
}
