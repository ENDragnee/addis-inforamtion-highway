import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RelationshipsPage() {
  const { data: session } = useSession();
  const { data, error, mutate } = useSWR<{ relationships: any[] }>('/api/dashboard/relationships', fetcher);
  const [providerRoleId, setProviderRoleId] = useState('');
  const [dataSchemaId, setDataSchemaId] = useState('');

  const handleCreate = async () => {
    await fetch('/api/dashboard/relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerRoleId, dataSchemaId }),
    });
    mutate(); // refresh list
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Relationships</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Propose a Relationship</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 space-y-1">
                  <Label htmlFor="providerRoleId">Provider Role ID</Label>
                  <Input id="providerRoleId" value={providerRoleId} onChange={e => setProviderRoleId(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 space-y-1">
                  <Label htmlFor="dataSchemaId">Data Schema ID</Label>
                  <Input id="dataSchemaId" value={dataSchemaId} onChange={e => setDataSchemaId(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => { setProviderRoleId(''); setDataSchemaId(''); }}>Cancel</Button>
                <Button onClick={handleCreate}>Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!data && !error && <p>Loading...</p>}
        {error && <p className="text-red-500">Failed to load relationships.</p>}

        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Requester Role</TableHead>
                <TableHead>Provider Role</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.relationships.map(rel => (
                <TableRow key={rel.id} className="hover:bg-gray-50">
                  <TableCell>{rel.id}</TableCell>
                  <TableCell>{rel.requesterRole.name}</TableCell>
                  <TableCell>{rel.providerRole.name}</TableCell>
                  <TableCell>{rel.dataSchema.schemaId}</TableCell>
                  <TableCell>{rel.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}
