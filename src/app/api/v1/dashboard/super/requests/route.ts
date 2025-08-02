import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const institutionId = searchParams.get('institutionId') || undefined;
    const schemaId = searchParams.get('schemaId') || undefined;
    const dateFrom = searchParams.get('from') || undefined;
    const dateTo = searchParams.get('to') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (institutionId) {
      where.OR = [
        { requesterId: institutionId },
        { providerId: institutionId },
      ];
    }
    if (schemaId) where.dataSchemaId = schemaId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const dataRequests = await prisma.dataRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json({ data: dataRequests }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/dataRequests] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}