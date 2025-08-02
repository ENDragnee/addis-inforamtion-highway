// app/api/schemas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schemas = await prisma.dataSchema.findMany({
    include: {
      relationships: true,
      dataRequests: true,
    },
  });

  return NextResponse.json({ schemas });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { schemaId, description } = body;

  if (!schemaId || !description) {
    return NextResponse.json({ error: 'schemaId and description required' }, { status: 400 });
  }

  const newSchema = await prisma.dataSchema.create({
    data: {
      schemaId,
      description,
    },
  });

  return NextResponse.json({ schema: newSchema });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, schemaId, description } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const updatedSchema = await prisma.dataSchema.update({
    where: { id },
    data: {
      ...(schemaId && { schemaId }),
      ...(description && { description }),
    },
  });

  return NextResponse.json({ schema: updatedSchema });
}
