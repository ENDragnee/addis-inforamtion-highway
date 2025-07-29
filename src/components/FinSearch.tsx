
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

export default function FinSearch() {
  const [fin, setFin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (message) {
      if (status === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
      // Clean the URL so the toast doesn't reappear on refresh
      router.replace('/', { scroll: false }); 
    }
  }, [searchParams, router]);

  const handleFetchInfo = () => {
    if (!fin.trim()) {
      toast.error('Please enter a valid FIN.');
      return;
    }
    setIsLoading(true);
    // Redirect the entire page to the API route to start the OIDC flow
    window.location.href = `/api/verifayda/initiate-fetch?fin=${fin}`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <Toaster position="top-center" richColors />
      <h2 style={{ marginBottom: '16px' }}>Verify User by FIN</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          placeholder="Enter user's FIN"
          disabled={isLoading}
          style={{
            flexGrow: 1,
            padding: '12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={handleFetchInfo}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Redirecting...' : 'Fetch Info'}
        </button>
      </div>
    </div>
  );
}
