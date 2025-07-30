import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If no session, redirect to login (middleware should also do this)
  if (!session) {
    redirect('/login');
  }

  // THIS IS THE CRITICAL REDIRECTION LOGIC
  if (session.user.type === 'SUPER_USER') {
    redirect('/super/dashboard'); // Redirect privileged users to their own dashboard
  }

  // Regular InstitutionUsers will see this content
  return (
    <div>
      <h1>Institution Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>You are logged in for institution ID: {session.user.institutionId}</p>
      <p>Your role is: {session.user.institutionRole}</p>
      {/* Your institution-specific dashboard content goes here */}
    </div>
  );
}
