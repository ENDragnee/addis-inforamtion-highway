//@/app/api/v1/mobile/users/register-push-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Helper to get user ID from the session token
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch (e) {
    return null;
  }
}

const tokenSchema = z.object({
  token: z.string().min(1, { message: 'Push token cannot be empty.' }),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = tokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }
    const { token: pushToken } = validation.data;

    // To ensure uniqueness, first clear this token from any other user who might have had it.
    // This handles cases where a user logs out and another logs in on the same device.
    await prisma.user.updateMany({
      where: { pushToken },
      data: { pushToken: null },
    });

    // Now, associate the token with the current user.
    await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });

    return NextResponse.json({ message: 'Push token registered successfully.' });

  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
