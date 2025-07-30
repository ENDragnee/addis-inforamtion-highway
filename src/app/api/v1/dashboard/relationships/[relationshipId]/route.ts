// app/api/dashboard/relationships/[relationshipId]/route.ts

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { relationshipId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.type !== 'INSTITUTION_USER') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { institutionId, institutionRole } = session.user
  const { relationshipId } = params

  const body = await req.json()
  const { newStatus } = body

  if (!['ACTIVE', 'REJECTED', 'REVOKED'].includes(newStatus)) {
    return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 })
  }

  // ✅ Get the Relationship, including roles and their institutions
  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    include: {
      requesterRole: { include: { institutions: true } },
      providerRole: { include: { institutions: true } },
    },
  })

  if (!relationship) {
    return new Response(JSON.stringify({ error: 'Relationship not found' }), { status: 404 })
  }

  const isRequester = relationship.requesterRole.institutions.some(i => i.id === institutionId)
  const isProvider = relationship.providerRole.institutions.some(i => i.id === institutionId)

  if (!isRequester && !isProvider) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  // ✅ Example logic: only providers can approve/reject,
  // requesters can revoke (optional — adjust to your rules)
  if (newStatus === 'ACTIVE' || newStatus === 'REJECTED') {
    if (!isProvider) {
      return new Response(JSON.stringify({ error: 'Only provider can approve/reject' }), { status: 403 })
    }
  }

  if (newStatus === 'REVOKED') {
    if (!isRequester && !isProvider) {
      return new Response(JSON.stringify({ error: 'Only requester or provider can revoke' }), { status: 403 })
    }
  }

  const updated = await prisma.relationship.update({
    where: { id: relationshipId },
    data: { status: newStatus },
  })

  return new Response(JSON.stringify({ relationship: updated }), { status: 200 })
}
