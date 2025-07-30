import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const navItems = [
    { label: 'Relationships', href: '/dashboard/relationships' },
    { label: 'Institution', href: '/dashboard/institution' },
    { label: 'Schemas', href: '/dashboard/schemas' },
    { label: 'Roles', href: '/dashboard/roles' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r p-4">
        <div className="mb-8 flex items-center space-x-2">
          <Menu className="h-6 w-6" />
          <span className="text-xl font-semibold">Partner Dashboard</span>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <a className="block rounded-lg px-3 py-2 text-base hover:bg-gray-100">
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b bg-white p-4">
          <div>
            {session?.user && (
              <div className="flex items-center space-x-3">
                <Avatar>
                  {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.institutionId ? 'Institution User' : 'Super User'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
            Logout
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
