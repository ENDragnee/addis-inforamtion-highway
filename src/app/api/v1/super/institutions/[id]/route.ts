import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institutionId = params.id;

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: {
        id: true,
        name: true,
        apiEndpoint: true,
        publicKey: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    return NextResponse.json({ data: institution }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/institutions/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institutionId = params.id;
    const body = await req.json();
    const { name, roleId, apiEndpoint, publicKey, clientSecretHash } = body;

    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: {
        ...(name && { name }),
        ...(roleId && { roleId }),
        ...(apiEndpoint && { apiEndpoint }),
        ...(publicKey && { publicKey }),
        ...(clientSecretHash && { clientSecretHash }),
      },
      select: {
        id: true,
        name: true,
        apiEndpoint: true,
        publicKey: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: updatedInstitution }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/institutions/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const institutionId = params.id;

    await prisma.institution.delete({
      where: { id: institutionId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/institutions/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}