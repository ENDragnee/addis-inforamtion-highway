import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    // NEW: Get pagination and search params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build the dynamic WHERE clause for relationships
    const where: Prisma.RelationshipWhereInput = search
      ? {
          OR: [
            { requesterRole: { name: { contains: search, mode: 'insensitive' } } },
            { providerRole: { name: { contains: search, mode: 'insensitive' } } },
            { dataSchema: { schemaId: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    // Fetch all roles for the graph nodes (these are not paginated)
    const rolesWithInstitutionCount = await prisma.role.findMany({
      include: { _count: { select: { institutions: true } } },
    });

    // Fetch the total count and the paginated relationships
    const [totalRelationships, relationships] = await Promise.all([
      prisma.relationship.count({ where }),
      prisma.relationship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requesterRole: { select: { name: true } },
          providerRole: { select: { name: true } },
          dataSchema: { select: { schemaId: true, description: true } },
        },
      }),
    ]);

    // Format nodes and edges as before
    const nodes = rolesWithInstitutionCount.map(role => ({
      id: role.id, type: 'institution', position: { x: 0, y: 0 },
      data: { label: role.name, role: `${role._count.institutions} institution(s)` },
    }));

    const edges = relationships.map(rel => ({
      id: rel.id, source: rel.requesterRoleId, target: rel.providerRoleId,
      type: rel.status.toLowerCase(), label: rel.dataSchema.schemaId,
      data: {
        status: rel.status, description: rel.dataSchema.description,
        requesterName: rel.requesterRole.name, providerName: rel.providerRole.name,
      },
    }));

    return NextResponse.json({
      nodes,
      edges,
      // NEW: Include pagination metadata for the table view
      meta: {
        total: totalRelationships,
        page,
        limit,
        totalPages: Math.ceil(totalRelationships / limit),
      },
    });

  } catch (error) {
    console.error('[GET /api/super/graph-data] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
