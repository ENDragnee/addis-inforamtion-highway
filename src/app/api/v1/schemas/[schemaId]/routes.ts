import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withM2MAuth, AuthenticatedRequest } from '@/lib/m2m-auth';

// Define a type for the route's context for clarity
interface RouteContext {
  params: Promise<{ schemaId: string }>;
}

export const GET = withM2MAuth(async (
  request: AuthenticatedRequest,
  { params }: RouteContext
) => {
  try {
    const { schemaId } = await params;
    console.log(`Authenticated institution '${request.institution.name}' is fetching schema: ${schemaId}`);

    const schema = await prisma.dataSchema.findFirst({
      where: {
        // Allows the client to use either the CUID or the human-readable schemaId
        OR: [
          { id: schemaId },
          { schemaId: schemaId },
        ],
      },
    });

    if (!schema) {
      return new NextResponse('Schema not found', { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (err: any) {
    console.error(`[GET /api/v1/institution/schemas/${(await params).schemaId}] Handler Error:`, err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});
