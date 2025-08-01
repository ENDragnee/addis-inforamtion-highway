// app/api/roles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await prisma.role.findMany({
    include: {
      institutions: true,
      requesterRelations: true,
      providerRelations: true,
    },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: 'Role name required' }, { status: 400 });
  }

  const role = await prisma.role.create({
    data: {
      name,
      description,
    },
  });

  return NextResponse.json({ role });
}
