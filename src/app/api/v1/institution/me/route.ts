//institution/me/route.ts
import { NextResponse } from 'next/server';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';
import prisma from '@/lib/prisma';

/**
 * GET /institution/me
 * Returns the authenticated institution's own metadata.
 */
const handler = async (req: AuthenticatedRequest): Promise<NextResponse> => {
  const institution = await prisma.institution.findUnique({
    where: {
      id: req.institution.id,
    },
    include: {
      role: true,
    },
  });

  if (!institution) {
    return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
  }

  return NextResponse.json({
    institution: {
      id: institution.id,
      name: institution.name,
      clientId: institution.clientId,
      status: institution.status,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
      apiEndpoint: institution.apiEndpoint,
      role: {
        id: institution.role.id,
        name: institution.role.name,
        description: institution.role.description,
      },
    },
  });
};

export const GET = withM2MAuth(handler);
