import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client'; // Import the Prisma namespace
import { z } from 'zod';

const schemaValidation = z.object({
  schemaId: z.string().min(3, 'Schema ID must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  parameters: z.record(z.string(), z.string()).optional(),
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
    const sort = searchParams.get('sort') || 'schemaId:asc';
    const skip = (page - 1) * limit;

    const [sortField, sortOrder] = sort.split(':');
    let orderBy: Prisma.DataSchemaOrderByWithRelationInput = {};

    if (sortField === 'relationshipCount') {
      orderBy = { relationships: { _count: sortOrder as 'asc' | 'desc' } };
    } else {
      orderBy = { [sortField]: sortOrder as 'asc' | 'desc' };
    }

    const where: Prisma.DataSchemaWhereInput = search
      ? { OR: [
            { schemaId: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]}
      : {};

    const [total, schemas] = await Promise.all([
      prisma.dataSchema.count({ where }),
      prisma.dataSchema.findMany({
        where, skip, take: limit, orderBy,
        include: { _count: { select: { relationships: true } } },
      }),
    ]);
    
    const formattedSchemas = schemas.map(s => ({ ...s, relationshipCount: s._count.relationships }));

    return NextResponse.json({
      data: formattedSchemas,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/super/schemas] Error:', error);
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
    const validation = schemaValidation.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid body', details: validation.error.issues }, { status: 400 });
    }
    const { schemaId, description, parameters } = validation.data;

    const newSchema = await prisma.dataSchema.create({
      data: { 
        schemaId, 
        description, 
        parameters: parameters ? (parameters as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
    return NextResponse.json({ data: newSchema, message: 'Schema created successfully' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/super/schemas] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
