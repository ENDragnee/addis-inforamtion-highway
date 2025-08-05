//@/app/api/v1/mobile/users/register-fcm-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Helper to get user ID from the app's session token
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch (e) {
    console.error("Token verification failed in getUserIdFromToken:", e);
    return null;
  }
}

// Zod schema for validating the incoming request body
const fcmTokenSchema = z.object({
  // The key in the JSON body from Flutter will be 'fcmToken'
  fcmToken: z.string().min(1, { message: 'FCM token cannot be empty.' }),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user via their session token
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token.' }, { status: 401 });
    }

    // 2. Validate the request body
    const body = await request.json();
    const validation = fcmTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }
    
    // Use the validated fcmToken
    const { fcmToken } = validation.data;

    // 3. To ensure uniqueness, first clear this token from any other user.
    // This handles the "shared device" scenario correctly.
    await prisma.user.updateMany({
      where: { 
        fcmToken: fcmToken,
      },
      data: { 
        fcmToken: null,
      },
    });

    // 4. Now, associate the token with the current user.
    await prisma.user.update({
      where: { 
        id: userId,
      },
      data: { 
        fcmToken: fcmToken,
      },
    });

    return NextResponse.json({ message: 'FCM token registered successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error registering FCM token:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
