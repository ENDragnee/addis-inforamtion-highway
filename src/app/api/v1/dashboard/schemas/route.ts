// app/api/dashboard/schemas/route.ts

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const schemas = await prisma.dataSchema.findMany({
    select: {
      id: true,
      schemaId: true,
      description: true,
    },
    orderBy: { schemaId: 'asc' },
  })

  return new Response(JSON.stringify({ schemas }), { status: 200 })
}
