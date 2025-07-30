// app/api/dashboard/institution/route.ts

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.type !== 'INSTITUTION_USER') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const institution = await prisma.institution.findUnique({
    where: { id: session.user.institutionId },
    select: {
      id: true,
      name: true,
      apiEndpoint: true,
      publicKey: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!institution) {
    return new Response(JSON.stringify({ error: 'Institution not found' }), { status: 404 })
  }

  return new Response(JSON.stringify({ institution }), { status: 200 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.type !== 'INSTITUTION_USER') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (session.user.institutionRole !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const body = await req.json()
  const { apiEndpoint, publicKey } = body

  if (!apiEndpoint && !publicKey) {
    return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 })
  }

  const updated = await prisma.institution.update({
    where: { id: session.user.institutionId },
    data: {
      ...(apiEndpoint && { apiEndpoint }),
      ...(publicKey && { publicKey }),
    },
    select: {
      id: true,
      name: true,
      apiEndpoint: true,
      publicKey: true,
      updatedAt: true,
    },
  })

  return new Response(JSON.stringify({ institution: updated }), { status: 200 })
}
