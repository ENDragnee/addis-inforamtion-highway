import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Note: Using the path consistent with your other files. If this is wrong, adjust as needed.
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { InstitutionStatus, Prisma } from '@/generated/prisma/client'; // Import Prisma namespace

// --- Zod Schema for robust validation ---
// REMOVED: The clientSecret field is no longer needed.
const createInstitutionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.string().cuid('A valid role must be selected'),
  apiEndpoint: z.string().url('Must be a valid URL'),
  publicKey: z.string().min(10, 'Public key is required'),
});

// --- GET (List) Institutions ---
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
    // THE FIX: Get the status from query params
    const status = searchParams.get('status') as InstitutionStatus | 'all';
    
    const skip = (page - 1) * limit;

    // THE FIX: Build a more complex WHERE clause
    let where: Prisma.InstitutionWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const [total, institutions] = await Promise.all([
        prisma.institution.count({ where }),
        prisma.institution.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                clientId: true,
                createdAt: true,
                publicKey: true,
                role: { select: { id: true, name: true } },
            },
        })
    ]);

    return NextResponse.json({
      data: institutions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/super/institutions] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- POST (Create) an Institution ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = createInstitutionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }
    
    // UPDATED: No longer destructuring clientSecret
    const { name, roleId, apiEndpoint, publicKey } = validation.data;

    const newInstitution = await prisma.institution.create({
      data: {
        name,
        roleId,
        apiEndpoint,
        publicKey,
        // REMOVED: clientSecretHash is no longer in the schema
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        apiEndpoint: true,
        publicKey: true,
        clientId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: newInstitution, message: 'Institution created successfully. It is pending approval.' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/super/institutions] Error:', error);
    if (error) {
        return NextResponse.json({ error: 'An institution with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
