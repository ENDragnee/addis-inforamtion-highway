import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Ensure user is authenticated
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r">
        <div className="p-4 text-xl font-bold">
          Partner Dashboard
        </div>
        <nav className="mt-6 flex flex-col space-y-1">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Home
          </Link>
          <Link
            href="/dashboard/relationships"
            className="px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Relationships
          </Link>
          <Link
            href="/dashboard/institution"
            className="px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Institution
          </Link>
          <Link
            href="/dashboard/schemas"
            className="px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Schemas
          </Link>
          <Link
            href="/dashboard/roles"
            className="px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Roles
          </Link>
        </nav>
        <div className="mt-auto p-4">
          <button
            onClick={() => {
              // client-side sign out
              window.location.href = '/api/auth/signout'
            }}
            className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-white p-8 overflow-auto">
        <h1 className="text-3xl font-semibold mb-4">Welcome, {session.user?.name || session.user?.email}</h1>
        <p className="text-gray-600">
          Select an option from the sidebar to get started.
        </p>
      </main>
    </div>
  )
}
