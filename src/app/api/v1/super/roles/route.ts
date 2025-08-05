import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

// Zod schema for creating/updating a role
const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  dataSchemaIds: z.array(z.string().cuid()).optional(), // The array of ALL schema IDs for this role
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const [total, roles] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { institutions: true } },
          dataSchemas: { select: { id: true, schemaId: true, description: true } },
        },
      }),
    ]);
    
    const formattedRoles = roles.map(role => ({
      ...role,
      institutionCount: role._count.institutions,
    }));

    return NextResponse.json({
      data: formattedRoles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/super/roles] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // THE FIX (Part 1): Destructure the validated data
    const { name, description, dataSchemaIds } = validation.data;

    // THE FIX (Part 2): Construct the correct Prisma `create` payload
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        // This is the correct way to connect many-to-many relationships on creation.
        // If the `dataSchemaIds` array exists and has items, create the `connect` object.
        dataSchemas: (dataSchemaIds && dataSchemaIds.length > 0) ? {
          connect: dataSchemaIds.map(id => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json({ data: newRole, message: 'Role created successfully' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/super/roles] Error:', error);
    
    // THE FIX (Part 3): Implement robust error handling for unique constraints
    if (error) {
      return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
