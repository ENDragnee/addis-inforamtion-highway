import SignupForm from '@/components/auth/signup/SignupForm';
import AuthLayout from '@/components/auth/AuthLayout';

// This is a Server Component to fetch data
export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Your Account"
      description="Join your institution on the platform."
    >
      <SignupForm />
    </AuthLayout>
  );
}
