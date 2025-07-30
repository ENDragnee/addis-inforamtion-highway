'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navLinks = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/relationships', label: 'Relationships' },
    { href: '/dashboard/institution', label: 'Institution Profile' },
    { href: '/dashboard/roles', label: 'Roles' },
    { href: '/dashboard/schemas', label: 'Schemas' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-4">
        <div className="mb-8 text-xl font-bold">Partner Dashboard</div>
        <nav className="flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-2 transition-colors ${
                pathname === link.href
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          className="mt-auto border border-white text-white hover:bg-gray-800"
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-medium">Dashboard</div>
          {session?.user && (
            <div className="text-sm text-gray-600">
              {session.user.email} — {session.user.institutionRole}
            </div>
          )}
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
