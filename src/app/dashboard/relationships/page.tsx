'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Loading from '@/components/ui/loading'; // Use your existing loading component
import CreateRelationshipDialog from '@/components/dashboard/CreateRelationshipDialog';
import RelationshipsTable from '@/components/dashboard/RelationshipsTable';

// A single fetcher for multiple SWR hooks
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RelationshipsPage() {
  const { data: session } = useSession();

  // Fetch all necessary data in parallel
  const { data: relationshipsData, error: relationshipsError, mutate: mutateRelationships } = useSWR('/api/v1/dashboard/relationships', fetcher);
  const { data: rolesData, error: rolesError } = useSWR('/api/v1/dashboard/roles', fetcher);
  const { data: schemasData, error: schemasError } = useSWR('/api/v1/dashboard/schemas', fetcher);

  const isLoading = !relationshipsData && !relationshipsError || !rolesData && !rolesError || !schemasData && !schemasError;
  const hasError = relationshipsError || rolesError || schemasError;

  if (isLoading) return <Loading text="Loading relationship data..." />;
  if (hasError) return <p className="text-destructive">Failed to load necessary data.</p>;
  if (!session) return null; // Should be handled by layout, but good practice

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Relationships</CardTitle>
          <CardDescription>
            Propose, approve, or revoke data sharing connections with other institutions.
          </CardDescription>
        </div>
        <CreateRelationshipDialog 
          roles={rolesData.roles || []}
          schemas={schemasData.schemas || []}
          mutateRelationships={mutateRelationships}
        />
      </CardHeader>
      <CardContent>
        <RelationshipsTable
          relationships={relationshipsData.relationships || []}
          session={session}
          mutate={mutateRelationships}
        />
      </CardContent>
    </Card>
  );
}
