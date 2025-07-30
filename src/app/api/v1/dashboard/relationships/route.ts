// app/api/dashboard/relationships/route.ts

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ✅ GET: List all relationships for the institution
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.type !== 'INSTITUTION_USER') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { institutionId } = session.user

  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { requesterRole: { institutions: { some: { id: institutionId } } } },
        { providerRole: { institutions: { some: { id: institutionId } } } },
      ],
    },
    include: {
      requesterRole: true,
      providerRole: true,
      dataSchema: true,
    },
  })

  return new Response(JSON.stringify({ relationships }), { status: 200 })
}

// ✅ POST: Propose a new relationship
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.type !== 'INSTITUTION_USER') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!['ADMIN', 'MEMBER'].includes(session.user.institutionRole || '')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const { institutionId } = session.user
  const body = await req.json()

  const { providerRoleId, dataSchemaId } = body

  if (!providerRoleId || !dataSchemaId) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  // ✅ Find requester's default role for the institution
  const requesterInstitution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { roleId: true },
  })

  if (!requesterInstitution) {
    return new Response(JSON.stringify({ error: 'Invalid institution' }), { status: 400 })
  }

  const newRelationship = await prisma.relationship.create({
    data: {
      requesterRoleId: requesterInstitution.roleId,
      providerRoleId,
      dataSchemaId,
      status: 'PENDING',
    },
  })

  return new Response(JSON.stringify({ relationship: newRelationship }), { status: 201 })
}
