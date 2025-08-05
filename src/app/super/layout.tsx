import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/super/Sidebar';
import MobileBottomBar from '@/components/super/MobileBottomBar';

export default async function SuperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.type !== 'SUPER_USER') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <Sidebar session={session} />

      <div className="flex flex-col sm:pl-14 md:pl-64">
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
      <MobileBottomBar />
    </div>
  );
}
