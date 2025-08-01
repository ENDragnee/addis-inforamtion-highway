// app/api/institutions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const institutions = await prisma.institution.findMany({
    include: {
      users: true,
      requestsMade: true,
      requestsReceived: true,
    },
  });

  return NextResponse.json({ institutions });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const { name, roleId, publicKey, apiEndpoint } = body;

  if (!name || !roleId || !publicKey || !apiEndpoint) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const newInstitution = await prisma.institution.create({
    data: {
      name,
      roleId,
      publicKey,
      apiEndpoint,
      clientId: crypto.randomUUID(),
      clientSecretHash: crypto.randomUUID(), // Ideally hash something stronger!
    },
  });

  return NextResponse.json({ institution: newInstitution });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, publicKey, apiEndpoint } = body;

  if (!id) {
    return NextResponse.json({ error: 'Institution ID required' }, { status: 400 });
  }

  const updatedInstitution = await prisma.institution.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(publicKey && { publicKey }),
      ...(apiEndpoint && { apiEndpoint }),
    },
  });

  return NextResponse.json({ institution: updatedInstitution });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Institution ID required' }, { status: 400 });
  }

  // Hard delete — you can replace this with a soft delete flag if needed
  await prisma.institution.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
