import prisma from '@/lib/prisma';
import SignupForm from '@/components/auth/signup/SignupForm';
import AuthLayout from '@/components/auth/AuthLayout';

// This is a Server Component to fetch data
export default async function SignupPage() {
  const institutions = await prisma.institution.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <AuthLayout
      title="Create Your Account"
      description="Join your institution on the platform."
    >
      <SignupForm institutions={institutions} />
    </AuthLayout>
  );
}
