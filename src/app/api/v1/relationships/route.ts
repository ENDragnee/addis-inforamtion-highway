import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import { z } from 'zod';

// Query schema: filter by status, fromDate, toDate, pagination
const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const parse = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parse.error.format() },
      { status: 400 }
    );
  }
  const { status, page, limit, fromDate, toDate } = parse.data;

  // 3. Find this institution's roles
  const roles = await prisma.role.findMany({
    where: {
      institutions: {
        some: { id: institution.id },
      },
    },
    select: { id: true },
  });
  const roleIds = roles.map(r => r.id);

  // 4. Build relationship filter
  const where: any = {
    OR: [
      { requesterRoleId: { in: roleIds } },
      { providerRoleId: { in: roleIds } },
    ],
  };

  if (status) where.status = status;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // 5. Query
  const [relationships, totalCount] = await Promise.all([
    prisma.relationship.findMany({
      where,
      include: {
        requesterRole: true,
        providerRole: true,
        dataSchema: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.relationship.count({ where }),
  ]);

  return NextResponse.json({
    data: relationships,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
