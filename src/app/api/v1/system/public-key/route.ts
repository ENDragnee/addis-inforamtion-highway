import { NextResponse } from 'next/server';


// GET /api/v1/system/public-key
export async function GET() {
  try {
    return NextResponse.json({
        publicKeyB64: process.env.SYSTEM_PUBLIC_KEY_B64,
    });
  } catch (error) {
    console.error('Failed to expose system public key:', error);
    return NextResponse.json({ error: 'Unable to retrieve public key' }, { status: 500 });
  }
}
