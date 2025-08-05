import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

const schemaValidation = z.object({
  schemaId: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  parameters: z.record(z.string(), z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ schemaId: string }>;
}

// --- PATCH (Update) a Data Schema ---
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { schemaId } = await params;
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

    const { schemaId, description, parameters } = validation.data;

    const updatedSchema = await prisma.dataSchema.update({
      where: { id: schemaId },
      data: { schemaId, description, parameters: parameters || Prisma.JsonNull },
    });

    return NextResponse.json({ data: updatedSchema, message: 'Schema updated successfully' });
  } catch (error) {
    console.error(`[PATCH /api/super/schemas/${schemaId}] Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE a Data Schema ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { schemaId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Safety check: Prevent deletion if schema is in use by relationships
    const relationshipCount = await prisma.relationship.count({ where: { dataSchemaId: schemaId } });
    if (relationshipCount > 0) {
      return NextResponse.json({ error: `Cannot delete. Schema is used in ${relationshipCount} relationship(s).` }, { status: 409 });
    }

    await prisma.dataSchema.delete({ where: { id: schemaId } });

    return NextResponse.json({ message: 'Schema deleted successfully.' });
  } catch (error) {
    console.error(`[DELETE /api/super/schemas/${schemaId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete schema' }, { status: 500 });
  }
}
