import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createRelationshipSchema = z.object({
  requesterRoleId: z.string().cuid('Requester role is required'),
  providerRoleId: z.string().cuid('Provider role is required'),
  dataSchemaId: z.string().cuid('Data schema is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'SUPER_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = createRelationshipSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.issues }, { status: 400 });
    }

    const newRelationship = await prisma.relationship.create({
      data: {
        ...validation.data,
        status: 'ACTIVE', // Superuser-created relationships are active by default
      },
    });

    return NextResponse.json({ data: newRelationship, message: 'Relationship created successfully' }, { status: 201 });
  } catch (error) {
    if (error) {
      return NextResponse.json({ error: 'This relationship rule already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
