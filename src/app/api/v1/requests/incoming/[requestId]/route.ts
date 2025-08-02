// File: /app/api/v1/requests/incoming/[requestId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { institution: provider, error: authError } = await authenticateInstitution(request);
  if (authError || !provider) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  const requestId = params.requestId;

  try {
    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        dataOwner: true,
        dataSchema: true,
      },
    });

    if (!dataRequest) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Check ownership: must be the provider institution
    if (dataRequest.providerId !== provider.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return NextResponse.json(dataRequest);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
