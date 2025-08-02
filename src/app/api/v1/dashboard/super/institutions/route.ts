// app/api/institutions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const skip = (page - 1) * limit

    // ✅ Build filter
    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {}

    // ✅ Fetch total count
    const total = await prisma.institution.count({ where })

    // ✅ Fetch paginated results
    const institutions = await prisma.institution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: institutions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/institutions] Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, roleId, apiEndpoint, publicKey, clientSecretHash } = body;

    if (!name || !roleId || !apiEndpoint || !publicKey || !clientSecretHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newInstitution = await prisma.institution.create({
      data: {
        name,
        roleId,
        apiEndpoint,
        publicKey,
        clientSecretHash,
      },
      select: {
        id: true,
        name: true,
        apiEndpoint: true,
        publicKey: true,
        clientId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: newInstitution }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/institutions] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


