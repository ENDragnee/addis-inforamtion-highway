import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

// Helper function to securely get the user ID from the session token
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch (e) {
    console.error('Token verification failed:', e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request using the app's session token
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing session token.' }, { status: 401 });
    }

    // 2. Validate the incoming request body
    const { devicePublicKey } = await request.json();
    if (!devicePublicKey || typeof devicePublicKey !== 'string') {
      return NextResponse.json({ error: 'Device public key is required and must be a string.' }, { status: 400 });
    }

    // 3. Update the user record with their device's public key
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    return NextResponse.json({ message: 'Device key registered successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error during device registration:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
