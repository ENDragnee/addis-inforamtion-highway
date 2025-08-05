import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for creating/updating a DataSchema
const schemaValidation = z.object({
  schemaId: z.string().min(3, 'Schema ID must be at least 3 characters (e.g., salary_v1)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// --- GET (List) all Data Schemas ---
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schemas = await prisma.dataSchema.findMany({
      orderBy: { schemaId: 'asc' },
      include: {
        _count: {
          select: { relationships: true }, // Count how many rules use this schema
        },
      },
    });

    // Transform the data for the frontend
    const formattedSchemas = schemas.map(schema => ({
      ...schema,
      relationshipCount: schema._count.relationships,
    }));

    return NextResponse.json({ data: formattedSchemas });
  } catch (error) {
    console.error('[GET /api/super/schemas] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (Create) a new Data Schema ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = schemaValidation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const newSchema = await prisma.dataSchema.create({
      data: validation.data,
    });

    return NextResponse.json({ data: newSchema, message: 'Data Schema created successfully' }, { status: 201 });
  } catch (error) {
    if (error) {
      return NextResponse.json({ error: 'A schema with this ID already exists.' }, { status: 409 });
    }
    console.error('[POST /api/super/schemas] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
