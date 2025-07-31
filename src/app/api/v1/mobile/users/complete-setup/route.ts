//@/src/app/api/v1/users/complete-setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password-utils'; // Your hashing utility

export async function POST(request: NextRequest) {
try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.sub;

    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // UPDATED: Expect both password and devicePublicKey
    const { password, devicePublicKey } = await request.json();

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (!devicePublicKey) {
      return NextResponse.json({ error: 'Device public key is required.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    
    // UPDATED: Store both fields in the database
    await prisma.user.update({
      where: { id: userId as string },
      data: { 
        hashedPassword,
        devicePublicKey, // Store the public key (as a stringified JSON)
      },
    });

    return NextResponse.json({ message: 'User setup completed successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Complete Setup Error:', error);
     if (error instanceof jose.errors.JOSEError) {
        return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
