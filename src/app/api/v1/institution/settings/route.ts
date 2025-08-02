// File: /app/api/v1/institution/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';

// Zod schema for PUT body
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  apiEndpoint: z.string().url().optional(),
  publicKey: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  const { id, name, apiEndpoint, publicKey } = institution;
  return NextResponse.json({ id, name, apiEndpoint, publicKey });
}

export async function PUT(request: NextRequest) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  let data: z.infer<typeof updateSchema>;
  try {
    data = await updateSchema.parseAsync(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body', details: (err as any).format?.() },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.institution.update({
      where: { id: institution.id },
      data,
      select: { id: true, name: true, apiEndpoint: true, publicKey: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return new NextResponse('Failed to update settings', { status: 500 });
  }
}
