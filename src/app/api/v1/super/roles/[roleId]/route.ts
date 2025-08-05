import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for validating the PATCH request body
const roleUpdateSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().optional(),
  // The client should send the complete list of schema IDs for this role
  dataSchemaIds: z.array(z.string().cuid()).optional(),
});

// Use a more direct type for route params for clarity
interface RouteContext {
  params: Promise<{ roleId: string }>;
}

// --- PATCH (Update) a Role ---
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { roleId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = roleUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    // THE FIX (Part 1): Destructure the validated data
    const { name, description, dataSchemaIds } = validation.data;

    // THE FIX (Part 2): Construct the correct Prisma `update` payload
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description,
        // This is the correct way to update a many-to-many relationship.
        // The `set` operator disconnects all existing schemas and connects the new list.
        dataSchemas: dataSchemaIds ? {
          set: dataSchemaIds.map(id => ({ id })),
        } : undefined, // If `dataSchemaIds` is not provided, do nothing to the relationship
      },
    });

    return NextResponse.json({ data: updatedRole, message: 'Role updated successfully' });
  } catch (error) {
    console.error(`[PATCH /api/super/roles/${roleId}] Error:`, error);
    // Handle potential unique constraint violation if the name is changed to one that already exists
    if (error) {
        return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE a Role ---
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { roleId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the role is in use by any institutions
    const institutionCount = await prisma.institution.count({ where: { roleId: roleId } });
    if (institutionCount > 0) {
      return NextResponse.json({ error: `Cannot delete role. It is assigned to ${institutionCount} institution(s).` }, { status: 409 });
    }
    
    // Safety Check: Also check if the role is used in any relationship rules
    const relationshipCount = await prisma.relationship.count({
        where: {
            OR: [
                { requesterRoleId: roleId },
                { providerRoleId: roleId },
            ]
        }
    });
    if (relationshipCount > 0) {
        return NextResponse.json({ error: `Cannot delete role. It is used in ${relationshipCount} relationship rule(s).`}, { status: 409 });
    }

    // Since the many-to-many is implicit, Prisma handles disconnecting from dataSchemas automatically on delete.
    await prisma.role.delete({ where: { id: roleId } });

    return NextResponse.json({ message: 'Role deleted successfully.' });
  } catch (error) {
    console.error(`[DELETE /api/super/roles/${roleId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
