'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios'; // Import Axios
import { Loader2 } from 'lucide-react'; // For a loading spinner

// Import Shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Institution = {
  id: string;
  name: string;
};

interface SignupFormProps {
  institutions: Institution[];
}

export default function SignupForm({ institutions }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState(institutions[0]?.id || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Use axios for the POST request
      const response = await axios.post('/api/auth/signup', {
        name,
        email,
        password,
        institutionId,
      });

      // axios provides response data directly in the `data` property
      setSuccess(response.data.message);
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      // Axios automatically throws for non-2xx status codes
      if (axios.isAxiosError(err)) {
        // Access the error message from the API response
        setError(err.response?.data?.error || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {success && <p className="text-center text-sm font-medium" style={{color: "hsl(var(--chart-1))"}}>{success}</p>}
      
      <div className="grid gap-2">
        <Label htmlFor="institution">Institution</Label>
        {/* Using Shadcn's Select component */}
        <Select value={institutionId} onValueChange={setInstitutionId} required>
          <SelectTrigger id="institution">
            <SelectValue placeholder="Select an institution" />
          </SelectTrigger>
          <SelectContent>
            {institutions.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Creating Account...' : 'Sign Up'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
