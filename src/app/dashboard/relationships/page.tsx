import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RelationshipsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Fetch relationships from your API
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard/relationships`, {
    headers: {
      Cookie: '', // Session cookie handled automatically in SSR context
    },
    cache: 'no-store',
  })

  const data = await res.json()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Relationships</h1>
      <Link
        href="/dashboard/relationships/new"
        className="inline-block mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Propose New Relationship
      </Link>
      {data?.relationships?.length > 0 ? (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.relationships.map((rel: any) => (
              <tr key={rel.id}>
                <td className="px-4 py-2 border">{rel.id}</td>
                <td className="px-4 py-2 border">{rel.status}</td>
                <td className="px-4 py-2 border">{new Date(rel.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 border">
                  <Link
                    href={`/dashboard/relationships/${rel.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No relationships found.</p>
      )}
    </main>
  )
}