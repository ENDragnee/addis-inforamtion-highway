// app/api/relationships/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const relationships = await prisma.relationship.findMany({
    include: {
      requesterRole: true,
      providerRole: true,
      dataSchema: true,
    },
  });

  return NextResponse.json({ relationships });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { requesterRoleId, providerRoleId, dataSchemaId } = body;

  if (!requesterRoleId || !providerRoleId || !dataSchemaId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const newRelationship = await prisma.relationship.create({
      data: {
        requesterRoleId,
        providerRoleId,
        dataSchemaId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ relationship: newRelationship });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'ID and new status are required' }, { status: 400 });
  }

  // Validate new status is allowed
  const validStatuses = ['PENDING', 'ACTIVE', 'REJECTED', 'REVOKED'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updatedRelationship = await prisma.relationship.update({
    where: { id },
    data: {
      status,
    },
  });

  return NextResponse.json({ relationship: updatedRelationship });
}
