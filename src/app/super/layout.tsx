import type React from "react"
import Sidebar from "@/components/super/Sidebar"
import PageHeader from "@/components/super/PageHeader"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    redirect('/login');
  }
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
