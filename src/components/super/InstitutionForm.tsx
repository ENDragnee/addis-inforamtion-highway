'use client';

import { useEffect, useRef } from 'react';
import { Role, Institution } from '@/generated/prisma/client';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServerAction } from '@/hooks/use-server-action';
import toast from 'react-hot-toast';

interface InstitutionFormProps {
  isOpen: boolean;
  onClose: () => void;
  institution?: Institution;
  roles: Role[];
  upsertAction: (formData: FormData) => Promise<any>;
}

export function InstitutionForm({ isOpen, onClose, institution, roles, upsertAction }: InstitutionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const { execute, isPending, error } = useServerAction(upsertAction, {
    onSuccess: () => {
      toast.success(`Institution ${institution ? 'updated' : 'created'} successfully!`);
      onClose();
    },
    onError: (err: any) => {
      // Errors can be handled here if needed, but we'll display them inline
    }
  });

  // Reset the form when the dialog is closed or the institution changes
  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{institution ? 'Edit Institution' : 'Add New Institution'}</DialogTitle>
          <DialogDescription>
            {institution ? `Editing details for ${institution.name}.` : 'Fill in the details for the new institution.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={execute} className="space-y-4">
          {institution && <input type="hidden" name="id" value={institution.id} />}
          
          <div className="space-y-2">
            <Label htmlFor="name">Institution Name</Label>
            <Input id="name" name="name" defaultValue={institution?.name} required />
            {error?.name && <p className="text-xs text-destructive">{error.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleId">Role</Label>
            <Select name="roleId" defaultValue={institution?.roleId}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             {error?.roleId && <p className="text-xs text-destructive">{error.roleId[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input id="apiEndpoint" name="apiEndpoint" defaultValue={institution?.apiEndpoint} required type="url" />
             {error?.apiEndpoint && <p className="text-xs text-destructive">{error.apiEndpoint[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key</Label>
            <Input id="publicKey" name="publicKey" defaultValue={institution?.publicKey} required />
             {error?.publicKey && <p className="text-xs text-destructive">{error.publicKey[0]}</p>}
          </div>
          
          {error?._form && <p className="text-sm text-destructive">{error._form[0]}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Institution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
