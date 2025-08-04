import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth } from '@/lib/m2m-auth';
import { stat } from 'fs';
import { da } from 'zod/v4/locales';

// GET /api/v1/relationships/available

export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const institutionId = req.institution.id;

    // Parse pagination params
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {  
        role: true,
      }
    });

    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Total count for pagination
    const total = await prisma.relationship.count({
      where: {
        requesterRoleId: institution.role.id,
        status: 'ACTIVE',
      },
    });

    const relationships = await prisma.relationship.findMany({
      where: {
        requesterRoleId: institution.role.id,
        status: 'ACTIVE',
      },
      include: {
        providerRole: true,
        dataSchema: true,
      },
      skip,
      take: limit,
    });

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      relationships: relationships.map(rel => ({
        id: rel.id,
        status: rel.status,
        providerRole: {
          id: rel.providerRole.id, 
          name: rel.providerRole.name,
          description: rel.providerRole.description,
        },
        dataSchema: {
          id: rel.dataSchema.id,
          description: rel.dataSchema.description,
          schemaId: rel.dataSchema.schemaId,
        },
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

