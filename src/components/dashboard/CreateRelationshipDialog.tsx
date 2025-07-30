'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Define types for the data we expect from the API
type Role = { id: string; name: string };
type Schema = { id: string; schemaId: string; description: string };

interface CreateRelationshipDialogProps {
  roles: Role[];
  schemas: Schema[];
  mutateRelationships: () => void; // Function to refresh the main table
}

export default function CreateRelationshipDialog({ roles, schemas, mutateRelationships }: CreateRelationshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [providerRoleId, setProviderRoleId] = useState('');
  const [dataSchemaId, setDataSchemaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!providerRoleId || !dataSchemaId) {
      toast.error('Please select both a provider role and a data schema.');
      return;
    }
    setIsSubmitting(true);
    
    const promise = axios.post('/api/dashboard/relationships', {
      providerRoleId,
      dataSchemaId,
    });

    toast.promise(promise, {
      loading: 'Proposing new relationship...',
      success: (res) => {
        mutateRelationships(); // Refresh the table on success
        setOpen(false); // Close the dialog
        // Reset form state
        setProviderRoleId('');
        setDataSchemaId('');
        return res.data.message || 'Relationship proposed successfully!';
      },
      error: (err) => err.response?.data?.error || 'Failed to propose relationship.',
    }).finally(() => setIsSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Propose New Relationship
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Propose a New Data Relationship</DialogTitle>
          <DialogDescription>
            Select a provider role and the data schema you wish to request. This will send a proposal for them to approve.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="provider-role">Provider Role</Label>
            <Select value={providerRoleId} onValueChange={setProviderRoleId}>
              <SelectTrigger id="provider-role">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="data-schema">Data Schema</Label>
            <Select value={dataSchemaId} onValueChange={setDataSchemaId}>
              <SelectTrigger id="data-schema">
                <SelectValue placeholder="Select a schema..." />
              </SelectTrigger>
              <SelectContent>
                {schemas.map(schema => (
                  <SelectItem key={schema.id} value={schema.id}>{schema.schemaId} - {schema.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
