// app/api/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // optional
  const fromDate = searchParams.get('fromDate'); // optional ISO string
  const toDate = searchParams.get('toDate');     // optional ISO string

  const filters: any = {};

  if (status) {
    filters.status = status;
  }

  if (fromDate || toDate) {
    filters.createdAt = {};
    if (fromDate) filters.createdAt.gte = new Date(fromDate);
    if (toDate) filters.createdAt.lte = new Date(toDate);
  }

  const requests = await prisma.dataRequest.findMany({
    where: filters,
    include: {
      requester: true,
      provider: true,
      dataOwner: true,
      dataSchema: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
  }

  // Only allow manual status update to FAILED or EXPIRED
  if (!['FAILED', 'EXPIRED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status for manual update' }, { status: 400 });
  }

  try {
    const updatedRequest = await prisma.dataRequest.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Failed to update request status:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
