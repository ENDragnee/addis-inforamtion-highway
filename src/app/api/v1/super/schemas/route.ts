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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          schemaId: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const total = await prisma.dataSchema.count({ where });

    const dataSchemas = await prisma.dataSchema.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        schemaId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: dataSchemas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/dataSchemas] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { schemaId, description } = body;

    if (!schemaId || typeof schemaId !== 'string') {
      return NextResponse.json({ error: 'schemaId is required and must be a string' }, { status: 400 });
    }

    const existing = await prisma.dataSchema.findUnique({ where: { schemaId } });
    if (existing) {
      return NextResponse.json({ error: 'schemaId must be unique' }, { status: 409 });
    }

    const newDataSchema = await prisma.dataSchema.create({
      data: {
        schemaId,
        description: description || '',
      },
      select: {
        id: true,
        schemaId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: newDataSchema }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/dataSchemas] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}