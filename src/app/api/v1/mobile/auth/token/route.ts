//@/src/app/api/v1/mobile-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

// --- Configuration read from environment variables ---
const FAYDA_ISSUER = `https://${new URL(process.env.FAYDA_AUTHORIZATION_ENDPOINT!).hostname}`;
const FAYDA_CLIENT_ID = process.env.FAYDA_CLIENT_ID!;

export async function POST(request: NextRequest) {
try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

    // 1. Verify the ID Token
    const JWKS = jose.createRemoteJWKSet(new URL(`${FAYDA_ISSUER}/.well-known/jwks.json`));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: FAYDA_ISSUER,
      audience: FAYDA_CLIENT_ID,
    });
    
    // 2. Extract user info
    const { sub: verifaydaSub, email, name, fayda_id: externalId } = payload;
    if (!verifaydaSub || !email || !name || !externalId) {
      return NextResponse.json({ error: 'Essential user information missing from ID token.' }, { status: 400 });
    }

    // 3. Find or create the User
    let user = await prisma.user.findUnique({ where: { verifaydaSub } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          verifaydaSub: verifaydaSub as string,
          externalId: externalId as string,
          // IMPORTANT: Password is NOT set here.
          hashedPassword: "NEEDS_SETUP", // Use a placeholder to indicate setup is needed
        }
      });
    }

    // 4. Create a session token for YOUR app
    const yourAppSessionToken = await createAppSessionToken(user.id);

    return NextResponse.json({
      message: 'Authentication successful',
      sessionToken: yourAppSessionToken,
      // Tell the app if it needs to run the "create password" flow
      isNewUser: user.hashedPassword === "NEEDS_SETUP", 
    });

  } catch (error) {
    console.error('BFF Token Exchange Error:', error);
    if (error instanceof jose.errors.JWTExpired) {
        return NextResponse.json({ error: 'The provided token has expired.' }, { status: 401 });
    }
    if (error instanceof jose.errors.JOSEError) {
        return NextResponse.json({ error: 'Invalid token signature or claims.' }, { status: 401 });
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
