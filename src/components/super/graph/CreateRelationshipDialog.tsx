'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCreateRelationship } from '@/hooks/use-graph-data';
import { Role } from '@/generated/prisma/client';
import { Schema } from '@/hooks/use-schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface CreateRelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRole?: { id: string; name: string } | null;
  targetRole?: { id: string; name: string } | null;
  roles: Role[]; // The parent now ensures this is an array
  schemas: Schema[]; // The parent now ensures this is an array
}

export default function CreateRelationshipDialog({ 
  isOpen, 
  onClose, 
  sourceRole, 
  targetRole, 
  roles, 
  schemas 
}: CreateRelationshipDialogProps) {
  const [requesterRoleId, setRequesterRoleId] = useState('');
  const [providerRoleId, setProviderRoleId] = useState('');
  const [selectedSchemaId, setSelectedSchemaId] = useState('');
  const createMutation = useCreateRelationship();

  useEffect(() => {
    if (isOpen) {
      setRequesterRoleId(sourceRole?.id || '');
      setProviderRoleId(targetRole?.id || '');
      setSelectedSchemaId('');
    }
  }, [isOpen, sourceRole, targetRole]);

  const handleSubmit = () => {
    if (!requesterRoleId || !providerRoleId || !selectedSchemaId) {
      toast.error('Please select a requester, provider, and schema.');
      return;
    }
    createMutation.mutate({
      requesterRoleId,
      providerRoleId,
      dataSchemaId: selectedSchemaId,
    }, {
      onSuccess: () => onClose(),
    });
  };

  // Pre-fill check for dialog description
  const descriptionText = sourceRole && targetRole 
    ? <>Define a rule allowing <span className="font-bold text-primary">{sourceRole.name}</span> to request data from <span className="font-bold text-primary">{targetRole.name}</span>. Select the data schema for this rule.</>
    : "Define a rule that allows one role to request specific data from another.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Relationship Rule</DialogTitle>
          <DialogDescription>
            {descriptionText}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requester-role">Requester (Asker)</Label>
              <Select value={requesterRoleId} onValueChange={setRequesterRoleId} disabled={!!sourceRole}>
                <SelectTrigger id="requester-role"><SelectValue placeholder="Select a role..." /></SelectTrigger>
                <SelectContent>
                  {/* THE FIX: Add a check to ensure `roles` is an array before mapping */}
                  {Array.isArray(roles) && roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-role">Provider (Giver)</Label>
              <Select value={providerRoleId} onValueChange={setProviderRoleId} disabled={!!targetRole}>
                <SelectTrigger id="provider-role"><SelectValue placeholder="Select a role..." /></SelectTrigger>
                <SelectContent>
                  {/* THE FIX: Add a check to ensure `roles` is an array before mapping */}
                  {Array.isArray(roles) && roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="data-schema">Data Schema</Label>
            <Select value={selectedSchemaId} onValueChange={setSelectedSchemaId}>
              <SelectTrigger id="data-schema"><SelectValue placeholder="Select a schema for this rule..." /></SelectTrigger>
              <SelectContent>
                {/* THE FIX: Add a check to ensure `schemas` is an array before mapping */}
                {Array.isArray(schemas) && schemas.map(schema => (
                  <SelectItem key={schema.id} value={schema.id}>{schema.schemaId} ({schema.description})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
