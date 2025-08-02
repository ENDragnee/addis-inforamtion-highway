import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        consentTokenJti: true,
        requester: {
          select: { id: true, name: true },
        },
        provider: {
          select: { id: true, name: true },
        },
        dataSchema: {
          select: { id: true, schemaId: true },
        },
        dataOwner: {
          select: { id: true, externalId: true },
        },
      },
    });

    if (!dataRequest) {
      return NextResponse.json({ error: 'Data request not found' }, { status: 404 });
    }

    return NextResponse.json({ data: dataRequest }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/dataRequests/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, failureReason } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updated = await prisma.dataRequest.update({
      where: { id },
      data: {
        status,
        failureReason: failureReason || null,
      },
      select: {
        id: true,
        status: true,
        failureReason: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/dataRequests/[id]/updateStatus] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
