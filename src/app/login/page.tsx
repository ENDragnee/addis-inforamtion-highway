'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

// Import Shadcn UI components
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // A SuperUser will go to '/super/dashboard', others to '/dashboard'
  // We'll handle the actual redirect on the dashboard page itself.
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('An unexpected error occurred.');
    } finally {
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
