import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * This API endpoint prepares all necessary data for rendering the
 * relationships graph in the superuser dashboard.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [rolesWithInstitutionCount, relationships] = await Promise.all([
      // Fetch all roles and count how many institutions belong to each
      prisma.role.findMany({
        include: {
          _count: {
            select: { institutions: true },
          },
        },
      }),
      // Fetch all relationships with their related data
      prisma.relationship.findMany({
        include: {
          requesterRole: { select: { name: true } },
          providerRole: { select: { name: true } },
          dataSchema: { select: { schemaId: true, description: true } },
        },
      }),
    ]);

    // Transform Roles into React Flow Nodes
    const nodes = rolesWithInstitutionCount.map(role => ({
      id: role.id,
      type: 'institution', // We can keep the type name for the custom node component
      position: { x: 0, y: 0 }, // Layout will be calculated on the client
      data: {
        label: role.name,
        role: `${role._count.institutions} institution(s)`, // Sub-label shows the count
      },
    }));

    // Transform Relationships into React Flow Edges
    const edges = relationships.map(rel => ({
      id: rel.id,
      source: rel.requesterRoleId,
      target: rel.providerRoleId,
      type: rel.status.toLowerCase(), // 'pending', 'active', 'revoked'
      label: rel.dataSchema.schemaId,
      data: {
        status: rel.status,
        description: rel.dataSchema.description,
        requesterName: rel.requesterRole.name,
        providerName: rel.providerRole.name,
      },
    }));

    return NextResponse.json({ nodes, edges });

  } catch (error) {
    console.error('[GET /api/super/graph-data] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
