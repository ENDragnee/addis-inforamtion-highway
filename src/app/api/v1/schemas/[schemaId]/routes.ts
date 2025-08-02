// File: /app/api/v1/institution/schemas/[schemaId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { schemaId: string } }
) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  const { schemaId } = params;

  try {
    const schema = await prisma.dataSchema.findFirst({
      where: {
        OR: [
          { id: schemaId },
          { schemaId: schemaId },
        ],
      },
    });

    if (!schema) {
      return new NextResponse('Schema not found', { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
