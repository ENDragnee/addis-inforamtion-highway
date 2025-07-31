import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.dataRequest.findMany({
      where: { dataOwnerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { name: true } },
        provider: { select: { name: true } },
        dataSchema: { select: { schemaId: true, description: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching data requests:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
