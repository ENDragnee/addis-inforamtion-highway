import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    // 1. Authenticate the Institution
    const { institution, error: authError } = await authenticateInstitution(request);
    if (authError) return authError;

    try {
        const { requestId } = await params;

        // 2. Fetch the request
        const dataRequest = await prisma.dataRequest.findUnique({
            where: { id: requestId },
        });

        if (!dataRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // 3. Authorize: Ensure the caller is either the requester or the provider
        if (dataRequest.requesterId !== institution!.id && dataRequest.providerId !== institution!.id) {
            return NextResponse.json({ error: 'You are not authorized to view this request' }, { status: 403 });
        }
        
        // 4. Return the relevant status information
        return NextResponse.json({
            requestId: dataRequest.id,
            status: dataRequest.status,
            createdAt: dataRequest.createdAt,
            expiresAt: dataRequest.expiresAt,
            failureReason: dataRequest.failureReason,
        });

    } catch (err) {
        console.error('Error fetching request status:', err);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
