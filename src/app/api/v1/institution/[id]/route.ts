//institution/me/route.ts
import { NextResponse } from 'next/server';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';
import prisma from '@/lib/prisma';

/**
 * GET /institution/me
 * Returns the authenticated institution's own metadata.
 */
export const GET = withM2MAuth(async (req: any, res: any) => {
  const { requestId } = req.params.requestId;

  const institution = await prisma.institution.findUnique({
    where: {
      id: requestId,
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
      name: institution.name,
      publicKey: institution.publicKey,
      status: institution.status,
      role: {
        name: institution.role.name,
        description: institution.role.description,
      },
    },
  });
})

