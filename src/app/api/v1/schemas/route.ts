// File: /app/api/v1/institution/schemas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';

export async function GET(request: NextRequest) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  try {
    const schemas = await prisma.dataSchema.findMany({
      select: {
        id: true,
        schemaId: true,
        description: true,
      },
    });

    return NextResponse.json({ data: schemas });
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
