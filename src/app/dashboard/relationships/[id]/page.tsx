import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function RelationshipDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, error, mutate } = useSWR(
    id ? `/api/v1/dashboard/relationships/${id}` : null,
    fetcher
  );

  if (error) return <div>Error loading relationship</div>;
  if (!data) return <div>Loading...</div>;

  const { relationship } = data;

  async function updateStatus(newStatus: 'ACTIVE' | 'REJECTED' | 'REVOKED') {
    await fetch(`/api/v1/dashboard/relationships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus }),
    });
    mutate();
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Relationship Details</h1>
      <div className="mb-6 space-y-2">
        <p><strong>ID:</strong> {relationship.id}</p>
        <p><strong>Status:</strong> {relationship.status}</p>
        <p><strong>Requester Role:</strong> {relationship.requesterRoleId}</p>
        <p><strong>Provider Role:</strong> {relationship.providerRoleId}</p>
        <p><strong>Data Schema:</strong> {relationship.dataSchemaId}</p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={() => updateStatus('ACTIVE')}>Approve</Button>
        <Button onClick={() => updateStatus('REJECTED')} variant="destructive">Reject</Button>
        <Button onClick={() => updateStatus('REVOKED')} variant="outline">Revoke</Button>
      </div>
    </DashboardLayout>
  );
}
