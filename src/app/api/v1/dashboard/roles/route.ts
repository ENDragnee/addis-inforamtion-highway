// app/api/dashboard/roles/route.ts

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  })

  return new Response(JSON.stringify({ roles }), { status: 200 })
}
