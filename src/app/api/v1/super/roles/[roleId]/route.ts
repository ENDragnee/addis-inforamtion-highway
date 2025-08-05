import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ roleId: string }>;
}
// --- PATCH (Update) a Role ---
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roleId } = await params;
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = roleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: validation.data,
    });

    return NextResponse.json({ data: updatedRole, message: 'Role updated successfully' });
  } catch (error) {
    console.error(`[PATCH /api/super/roles/${(await params).roleId}] Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE a Role ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { roleId } = await params;
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the role is in use
    const institutionCount = await prisma.institution.count({ where: { roleId: roleId } });
    if (institutionCount > 0) {
      return NextResponse.json({ error: `Cannot delete role. It is currently assigned to ${institutionCount} institution(s).` }, { status: 409 });
    }

    await prisma.role.delete({ where: { id: roleId } });

    return NextResponse.json({ message: 'Role deleted successfully.' });
  } catch (error) {
    console.error(`[DELETE /api/super/roles/${(await params).roleId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
