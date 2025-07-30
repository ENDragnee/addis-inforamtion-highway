import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import SuperSidebar from '@/components/super/SuperSidebar';
import SuperNavbar from '@/components/super/SuperNavbar'; // IMPORT the new navbar

export default async function SuperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // This is the most critical security check.
  // If the user is not logged in or is not a SUPER_USER, redirect them.
  if (!session || session.user.type !== 'SUPER_USER') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <SuperSidebar user={session.user} />
      <main className="flex-1 p-8 bg-muted/40">
        <SuperNavbar /> 
        {children}
      </main>
    </div>
  );
}
