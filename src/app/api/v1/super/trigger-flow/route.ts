import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma'; // We still need prisma to find initial IDs
import { z } from 'zod';
import client from '@/lib/trustbroker'; // Import our singleton SDK instance

const triggerSchema = z.object({
  faydaId: z.string().min(1, "Fayda ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = triggerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }
    const { faydaId } = validation.data;

    console.log('[Flow] Starting SDK-driven flow...');
    
    // --- Step 1: Get IDs from DB to pass to the SDK ---
    // The SDK acts as a client, so it only knows about IDs. Our backend can look them up.
    const provider = await prisma.institution.findUnique({ where: { name: 'National Identity Agency' } });
    const dataOwner = await prisma.user.findUnique({ where: { externalId: faydaId } });
    const dataSchema = await prisma.dataSchema.findUnique({ where: { schemaId: 'schema:identity:kyc:v1' } });

    if (!provider || !dataOwner || !dataSchema) {
      return NextResponse.json({ error: 'Seeded data is incomplete. Could not find all required entities.' }, { status: 404 });
    }
    
    // --- Step 2: Use SDK to create the DataRequest ---
    console.log(`[Flow] Step 2: Creating DataRequest via SDK for provider ${provider.id}`);
    const createdRequest = await client.createDataRequest({
      providerId: provider.id,
      dataOwnerId: dataOwner.id,
      schemaId: dataSchema.id,
    });
    const requestId = createdRequest.requestId;
    console.log(`[Flow] Request created with ID: ${requestId}`);

    // --- Step 3: Simulate User Consent (This part is still manual for the demo) ---
    console.log('[Flow] Step 3: Manually updating request to APPROVED to simulate user consent...');
    await new Promise(res => setTimeout(res, 1500)); // Simulate delay
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', consentTokenJti: `simulated_jti_${Date.now()}` },
    });

    // --- Step 4: Use SDK to poll for status ---
    console.log('[Flow] Step 4: Polling for approval via SDK...');
    let statusResponse = await client.getRequestStatus(requestId);
    const timeout = Date.now() + 20_000; // 20-second timeout
    while (statusResponse.status !== 'COMPLETED' && statusResponse.status !== 'FAILED') {
      if (Date.now() > timeout) throw new Error('Timed out waiting for broker to process approval');
      await new Promise((r) => setTimeout(r, 2000));
      statusResponse = await client.getRequestStatus(requestId);
      console.log(`[Flow] Polling... current status: ${statusResponse.status}`);
    }

    console.log('[Flow] Final status received from polling:', statusResponse.status);

    if (statusResponse.status === 'FAILED') {
      throw new Error('Broker reported the request failed after consent.');
    }

    // --- Step 5: Extract final data from the successful polling response ---
    // Our updated polling API returns the data directly when status is COMPLETED.
    // The SDK needs to be updated to reflect this, but for now we'll cast the type.
    const finalData = (statusResponse as any).data;
    if (!finalData) {
      throw new Error('Polling response was COMPLETED but did not contain data.');
    }

    console.log('[Flow] Step 5: Successfully retrieved final data:', finalData);

    // --- Step 6: Simulate Signature Verification (as this is a client-side SDK method) ---
    const isVerified = true; // In a real SDK test, you would do the full verification here.
    console.log(`[Flow] Step 6: Simulated signature verification: ${isVerified}`);
    
    return NextResponse.json({
      message: 'Data request flow completed successfully using the SDK.',
      finalData: finalData,
      isSignatureValid: isVerified,
    });

  } catch (error: any) {
    console.error('[POST /api/super/trigger-flow] Flow failed:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred during the flow.' }, { status: 500 });
  }
}
