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
    const requesterRoleId = searchParams.get('requesterRoleId') || undefined;
    const providerRoleId = searchParams.get('providerRoleId') || undefined;
    const dataSchemaId = searchParams.get('dataSchemaId') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (requesterRoleId) where.requesterRoleId = requesterRoleId;
    if (providerRoleId) where.providerRoleId = providerRoleId;
    if (dataSchemaId) where.dataSchemaId = dataSchemaId;

    const relationships = await prisma.relationship.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requesterRole: {
          select: { id: true, name: true },
        },
        providerRole: {
          select: { id: true, name: true },
        },
        dataSchema: {
          select: { id: true, schemaId: true },
        },
      },
    });

    return NextResponse.json({ data: relationships }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/relationships] Error:', error);
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
    const { requesterRoleId, providerRoleId, dataSchemaId, status } = body;

    if (!requesterRoleId || !providerRoleId || !dataSchemaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.relationship.findUnique({
      where: {
        requesterRoleId_providerRoleId_dataSchemaId: {
          requesterRoleId,
          providerRoleId,
          dataSchemaId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 });
    }

    const newRelationship = await prisma.relationship.create({
      data: {
        requesterRoleId,
        providerRoleId,
        dataSchemaId,
        status: status || 'PENDING',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requesterRole: {
          select: { id: true, name: true },
        },
        providerRole: {
          select: { id: true, name: true },
        },
        dataSchema: {
          select: { id: true, schemaId: true },
        },
      },
    });

    return NextResponse.json({ data: newRelationship }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/relationships] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
