import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth } from '@/lib/m2m-auth';
import { stat } from 'fs';
import { da } from 'zod/v4/locales';

// GET /api/v1/relationships/available

export const GET = withM2MAuth(async (req: any, res: any) => {
  try {
    const institutionId = req.institution.id;
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {  
        role: true,
      }});
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const relationships = await prisma.relationship.findMany({
      where: {
        requesterRoleId: institution.role.id,
        status: 'ACTIVE',
      },
      include: {
        providerRole: true,
        dataSchema: true,
      }});

    return res.status(200).json({
      relationships: relationships.map(rel => ({
        id: rel.id,
        status: rel.status,
        providerRole: {
          id: rel.providerRole.id, 
          name: rel.providerRole.name,
          description: rel.providerRole.description,
        },
        dataSchema:  {
          id: rel.dataSchema.id,
          description: rel.dataSchema.description,
          schemaId: rel.dataSchema.schemaId,
        },
      })),
    });

      
  } catch (error) {
    console.error("Error in POST handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
