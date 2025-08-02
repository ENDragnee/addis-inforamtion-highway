import { NextRequest, NextResponse } from 'next/server';
import { authenticateInstitution } from '@/lib/m2m-auth'; // Provider authenticates itself here
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  // 1. Authenticate the institution making the introspection call (the Provider)
  const { institution: provider, error: authError } = await authenticateInstitution(request);
  if (authError || !provider) return authError ?? new NextResponse('Authentication failed', { status: 401 });

  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET is not set in environment variables.');
    }

    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);

    try {
      // 2. Verify the token's signature and claims (like expiration)
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'urn:trustbroker:platform',
        audience: 'urn:trustbroker:provider',
      });
      
      // 3. CRITICAL SECURITY CHECK: Ensure the token was intended for this specific provider.
      if (payload.providerId !== provider.id) {
        return NextResponse.json({ active: false, error: 'Token not valid for this provider' }, { status: 403 });
      }

      // 4. If all checks pass, return an active status with the token's payload
      return NextResponse.json({
        active: true,
        ...payload
      });

    } catch (jwtError: any) {
      // This will catch expired tokens, invalid signatures, etc.
      console.warn('JWT Introspection failed:', jwtError.message);
      return NextResponse.json({ active: false, error: 'Invalid or expired token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Introspection endpoint error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
