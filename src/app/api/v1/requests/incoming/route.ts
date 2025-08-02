// File: /app/api/v1/requests/incoming/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import { z } from 'zod';

// Define valid query parameters
const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: NextRequest) {
  // 1. Authenticate institution
  const { institution: provider, error: authError } = await authenticateInstitution(request);
  if (authError || !provider) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { status, page, limit, fromDate, toDate } = parseResult.data;

  // 3. Build Prisma filter
  const where: any = {
    providerId: provider.id,
  };

  if (status) {
    where.status = status;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // 4. Query DB with pagination
  try {
    const [requests, totalCount] = await Promise.all([
      prisma.dataRequest.findMany({
        where,
        include: {
          requester: true,
          dataOwner: true,
          dataSchema: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dataRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
