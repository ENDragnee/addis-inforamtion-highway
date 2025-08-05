'use client';

import { useState } from 'react';
// Import getSession to fetch the latest session data after login
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Suspense } from 'react';
import Loading from '@/components/ui/loading';

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginPageFunction />
    </Suspense>
  );
}

function LoginPageFunction() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // We no longer need searchParams for the callbackUrl as we determine it dynamically.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Important: We handle the redirect manually
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        // --- START: MODIFIED LOGIC ---
        // Login was successful. Now, get the session to check the user's role.
        const session = await getSession();

        // Check the role and redirect accordingly.
        // This assumes your NextAuth session callback adds the 'role' property to session.user
        if (session?.user?.type === 'SUPER_USER') {
          router.push('/super/dashboard');
        } else {
          router.push('/dashboard');
        }
        // router.refresh() is good practice to ensure the layout reflects the new session state
        router.refresh(); 
        // --- END: MODIFIED LOGIC ---
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('An unexpected error occurred.');
    } finally {
      // Don't set loading to false here, as the page will redirect away.
      // If there's an error, it will be set to false in the catch block.
      // We can leave it as is, or remove the setLoading(false) from the finally block.
      if (!error) return; // If success, don't flicker the UI by setting loading to false
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Log in to access your dashboard."
    >
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@institution.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{' '}
              <Link href="/signup" className="font-medium text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
