import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for creating/updating a role
const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
});

// --- GET (List) all Roles ---
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      // Include a count of related institutions
      include: {
        _count: {
          select: { institutions: true },
        },
      },
    });

    // Transform the data to match the frontend's expected format
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description ?? '',
      institutionCount: role._count.institutions,
    }));

    return NextResponse.json({ data: formattedRoles });
  } catch (error) {
    console.error('[GET /api/super/roles] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (Create) a new Role ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = roleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: validation.data,
    });

    return NextResponse.json({ data: newRole, message: 'Role created successfully' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/super/roles] Error:', error);
    if (error) {
      return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
