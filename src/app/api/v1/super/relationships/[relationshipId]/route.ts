import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'REVOKED']),
});


interface RouteParams {
  params: Promise<{ relationshipId: string }>;
}
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { relationshipId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: { status: validation.data.status },
    });
    
    return NextResponse.json({ data: updated, message: 'Relationship status updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { relationshipId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Safety Check: Prevent deleting a rule if it has recent requests
    const requestCount = await prisma.dataRequest.count({ where: { relationshipId: relationshipId }});
    if (requestCount > 0) {
        return NextResponse.json({ error: `Cannot delete: This rule is associated with ${requestCount} data request(s).`}, { status: 409 });
    }

    await prisma.relationship.delete({ where: { id: relationshipId } });

    return NextResponse.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 });
  }
}
