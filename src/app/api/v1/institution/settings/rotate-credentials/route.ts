// File: /app/api/v1/institution/settings/rotate-credentials/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateInstitution } from '@/lib/m2m-auth';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  const { institution, error } = await authenticateInstitution(request);
  if (error || !institution) {
    return new NextResponse('Authentication failed', { status: 401 });
  }

  // 1. Generate a new raw client secret
  const rawSecret = randomBytes(32).toString('hex');

  // 2. Hash it before storing
  const secretHash = await bcrypt.hash(rawSecret, 12);

  try {
    // 3. Update institution with new hash; leave publicKey/name untouched
    await prisma.institution.update({
      where: { id: institution.id },
      data: { clientSecretHash: secretHash },
    });

    // 4. Return the raw secret once
    return NextResponse.json({ clientSecret: rawSecret });
  } catch (err) {
    console.error(err);
    return new NextResponse('Failed to rotate credentials', { status: 500 });
  }
}
