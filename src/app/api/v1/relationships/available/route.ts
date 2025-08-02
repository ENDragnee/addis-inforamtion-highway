import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export async function GET(request: NextRequest) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parse = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parse.error.format() },
      { status: 400 }
    );
  }

  const { page, limit } = parse.data;

  // Find requester roles for this institution
  const roles = await prisma.role.findMany({
    where: {
      institutions: {
        some: { id: institution.id },
      },
    },
    select: { id: true },
  });
  const requesterRoleIds = roles.map(r => r.id);

  const where = {
    requesterRoleId: { in: requesterRoleIds },
    status: { equals: 'ACTIVE' as any },
  };

  // Get schemas through active relationships
  const [relationships, totalCount] = await Promise.all([
    prisma.relationship.findMany({
      where,
      include: { dataSchema: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.relationship.count({ where }),
  ]);

  // Return unique schemas only (optional)
  const schemas = relationships.map(r => r.dataSchema);

  return NextResponse.json({
    data: schemas,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
