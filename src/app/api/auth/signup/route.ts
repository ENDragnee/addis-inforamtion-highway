// src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password-utils';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  institutionId: z.string().cuid({ message: 'Invalid institution selected' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const { name, email, password, institutionId } = validation.data;

    const lowercasedEmail = email.toLowerCase();

    // Check if user already exists in either table
    const existingUser = await prisma.institutionUser.findUnique({
      where: { email: lowercasedEmail },
    });
    const existingSuperUser = await prisma.superUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (existingUser || existingSuperUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json({ error: 'The selected institution does not exist.' }, { status: 404 });
    }
    
    // UPDATED: Use the hashPassword utility function
    const hashedPassword = await hashPassword(password);

    // Create user
    await prisma.institutionUser.create({
      data: {
        name,
        email: lowercasedEmail,
        hashedPassword,
        institutionId,
      },
    });

    return NextResponse.json({ message: 'Account created successfully. Please log in.' }, { status: 201 });

  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
