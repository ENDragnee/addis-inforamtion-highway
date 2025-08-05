import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';

export const GET = withM2MAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log(`Authenticated institution '${request.institution.name}' is listing schemas.`);

    const schemas = await prisma.dataSchema.findMany({
      select: {
        id: true,
        schemaId: true,
        description: true,
        parameters: true, // It's useful for clients to know the schema structure
      },
      orderBy: {
        schemaId: 'asc',
      },
    });

    return NextResponse.json({ data: schemas });
  } catch (err: any) {
    console.error('[GET /api/v1/institution/schemas] Handler Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});
