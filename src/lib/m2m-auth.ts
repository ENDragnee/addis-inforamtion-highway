// lib/m2m-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Institution } from '@/generated/prisma';

export async function authenticateInstitution(request: NextRequest): Promise<{ institution: Institution | null, error: NextResponse | null }> {
  const clientId = request.headers.get('x-client-id');
  const clientSecret = request.headers.get('x-client-secret');

  if (!clientId || !clientSecret) {
    return { 
      institution: null, 
      error: NextResponse.json({ error: 'Missing API credentials' }, { status: 401 }) 
    };
  }

  const institution = await prisma.institution.findUnique({
    where: { clientId },
  });

  if (!institution) {
    return { 
      institution: null, 
      error: NextResponse.json({ error: 'Invalid client ID' }, { status: 401 }) 
    };
  }

  const isSecretValid = await bcrypt.compare(clientSecret, institution.clientSecretHash);

  if (!isSecretValid) {
    return { 
      institution: null, 
      error: NextResponse.json({ error: 'Invalid client secret' }, { status: 401 }) 
    };
  }

  return { institution, error: null };
}
