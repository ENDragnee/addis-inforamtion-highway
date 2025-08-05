import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for validating the PATCH request body
const updateInstitutionSchema = z.object({
  name: z.string().min(2).optional(),
  roleId: z.string().cuid().optional(),
  apiEndpoint: z.string().url().optional(),
  publicKey: z.string().min(10).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']).optional(),
});

interface RouteParams {
  params: Promise<{ institutionId: string }>;
}
// --- GET a single institution by ID ---
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const { institutionId } = await params
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        role: true, // Include related role information
      },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    return NextResponse.json({ data: institution }, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/super/institutions/${(await params).institutionId}] Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- PATCH (update) an institution by ID ---
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const { institutionId } = await params;
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateInstitutionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: validation.data,
    });

    return NextResponse.json({ data: updatedInstitution, message: 'Institution updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/super/institutions/${(await params).institutionId}] Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE an institution by ID ---
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
    try {
        const session = await getServerSession(authOptions);
        const { institutionId } = await params;
        if (!session || session.user.type !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.institution.delete({
            where: { id: institutionId },
        });

        return NextResponse.json({ message: 'Institution deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`[DELETE /api/super/institutions/${(await params).institutionId}] Error:`, error);
        return NextResponse.json({ error: 'Failed to delete institution' }, { status: 500 });
    }
}
