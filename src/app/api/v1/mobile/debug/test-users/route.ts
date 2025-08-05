import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose'; // ADD THIS LINE to import the necessary function

/**
 * @param userId - The ID of the user to create a token for.
 * @returns A promise that resolves to a JWT session token.
 */
async function createAppSessionToken(userId: string): Promise<string> {
  // Ensure the secret is loaded from your environment variables
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set in environment variables.');
  }
  const secretKey = new TextEncoder().encode(secret);

  // Now you can use SignJWT because it has been imported
  return await new SignJWT({ sub: userId, type: 'MOBILE_USER' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Give debug tokens a long life
    .sign(secretKey);
}

export async function GET(request: NextRequest) {
  // CRITICAL: This endpoint should only be available in development environments.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    // Fetch the 3 most recently created users from the database.
    const testUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        externalId: true,
        fcmToken: true, // Check if they already have an FCM token registered
      },
    });
    
    // For each user, generate a valid session token that the mobile app can use.
    const usersWithTokens = await Promise.all(
      testUsers.map(async (user) => {
        const sessionToken = await createAppSessionToken(user.id);
        return {
          id: user.id,
          // Create a simple, readable name for the button in the Flutter app
          name: `User (${user.externalId.slice(-6)})`,
          sessionToken: sessionToken,
          // This flag tells the Flutter app whether it needs to perform the FCM token registration
          needsFcmTokenSetup: !user.fcmToken,
        };
      })
    );

    return NextResponse.json(usersWithTokens);
  } catch (error) {
    console.error('Error fetching test users:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
