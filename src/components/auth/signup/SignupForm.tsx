// components/auth/signup/SignupForm.tsx (Updated)
'use client';

import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

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

// The 'institutions' prop is removed, as this component now fetches its own data.
export default function SignupForm() {
  // State for the form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  
  // State to hold the list of institutions fetched from the API
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // State for UI feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [isFetching, setIsFetching] = useState(true); // For initial data fetch

  const router = useRouter();

  // useEffect to fetch institutions when the component mounts
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        // Use the correct API route path
        const response = await axios.get<Institution[]>('/api/v1/institutions');
        const fetchedInstitutions = response.data;
        setInstitutions(fetchedInstitutions);

        // Pre-select the first institution if the list is not empty
        if (fetchedInstitutions.length > 0) {
          setInstitutionId(fetchedInstitutions[0].id);
        }
      } catch (fetchError) {
        console.error("Failed to fetch institutions:", fetchError);
        setError('Could not load institutions. Please refresh the page.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchInstitutions();
  }, []); // The empty array ensures this runs only once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/signup', {
        name,
        email,
        password,
        institutionId,
      });

      setSuccess(response.data.message);
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {success && <p className="text-center text-sm font-medium" style={{color: "hsl(var(--chart-1))"}}>{success}</p>}
      
      <div className="grid gap-2">
        <Label htmlFor="institution">Institution</Label>
        <Select 
          value={institutionId} 
          onValueChange={setInstitutionId} 
          required 
          disabled={isFetching || institutions.length === 0}
        >
          <SelectTrigger id="institution">
            <SelectValue placeholder={isFetching ? "Loading institutions..." : "Select an institution"} />
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
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isFetching} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isFetching} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isFetching} />
      </div>

      <Button type="submit" className="w-full mt-2" disabled={isSubmitting || isFetching}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
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
