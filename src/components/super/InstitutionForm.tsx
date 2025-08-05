'use client';

import { useEffect } from 'react';
// THE FIX: Import Controller from react-hook-form
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Role } from '@/generated/prisma/client';
import { useUpsertInstitution, Institution } from '@/hooks/use-institutions';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea for the public key

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.string({ error: 'A role must be selected' }).cuid(),
  apiEndpoint: z.string().url('Must be a valid URL'),
  publicKey: z.string().min(10, 'Public key is required'),
});

type FormData = z.infer<typeof formSchema>;

interface InstitutionFormProps {
  isOpen: boolean;
  onClose: () => void;
  institution?: Institution | null;
  roles: Role[]; // This prop should always be an array
}

export function InstitutionForm({ isOpen, onClose, institution, roles }: InstitutionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control, // Get control from useForm
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      roleId: '',
      apiEndpoint: '',
      publicKey: '',
    },
  });
  
  const upsertMutation = useUpsertInstitution();

  useEffect(() => {
    if (isOpen) {
      if (institution) {
        reset({
          name: institution.name,
          roleId: institution.roleId,
          apiEndpoint: institution.apiEndpoint,
          publicKey: institution.publicKey,
        });
      } else {
        reset({ name: '', roleId: '', apiEndpoint: '', publicKey: '' });
      }
    }
  }, [institution, isOpen, reset]);

  const onSubmit = (data: FormData) => {
    upsertMutation.mutate({ id: institution?.id, ...data }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{institution ? 'Edit Institution' : 'Add New Institution'}</DialogTitle>
          <DialogDescription>
            {institution ? `Editing details for ${institution.name}.` : 'Fill in the details for the new institution.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Institution Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleId">Role</Label>
            {/* THE FIX: Use the Controller component for the Select */}
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {(roles || []).map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input id="apiEndpoint" {...register('apiEndpoint')} type="url" />
            {errors.apiEndpoint && <p className="text-xs text-destructive">{errors.apiEndpoint.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key</Label>
            {/* Use a Textarea for better UX with long public keys */}
            <Textarea
              id="publicKey"
              className="font-mono"
              rows={4}
              {...register('publicKey')}
            />
            {errors.publicKey && <p className="text-xs text-destructive">{errors.publicKey.message}</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving...' : 'Save Institution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
