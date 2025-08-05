'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpsertRole, RoleWithDetails } from '@/hooks/use-roles';
import { useGetSchemas } from '@/hooks/use-schemas';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import Loading from '@/components/ui/loading';

// Define the form's validation schema using Zod
const formSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleWithDetails | null;
}

export function RoleForm({ isOpen, onClose, role }: RoleFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' },
  });

  // State for the MultiSelect component
  const [selectedSchemas, setSelectedSchemas] = useState<MultiSelectOption[]>([]);

  // Fetch all available schemas for the dropdown
  const { data: allSchemas, isLoading: areSchemasLoading } = useGetSchemas();
  const upsertMutation = useUpsertRole();

  // Effect to populate the form when editing an existing role
  useEffect(() => {
    if (isOpen && allSchemas) {
      if (role) {
        reset({ name: role.name, description: role.description ?? '' });
        // Map the role's existing schemas to the format our MultiSelect component expects
        const currentSchemas = role.dataSchemas.map(s => ({ value: s.id, label: s.schemaId }));
        setSelectedSchemas(currentSchemas);
      } else {
        // Reset form for creation
        reset({ name: '', description: '' });
        setSelectedSchemas([]);
      }
    }
  }, [role, isOpen, reset, allSchemas]);

  // Handle form submission
  const onSubmit = (data: FormData) => {
    // Get the array of schema IDs from the MultiSelect's state
    const dataSchemaIds = selectedSchemas.map(s => s.value);
    
    upsertMutation.mutate({ 
      id: role?.id, 
      ...data, 
      dataSchemaIds // Add the schema IDs to the mutation payload
    }, {
      onSuccess: () => onClose(),
    });
  };

  // Prepare options for the MultiSelect component
  const schemaOptions = allSchemas?.map(s => ({ value: s.id, label: s.schemaId })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role ? `Editing details for the "${role.name}" role.` : 'Define a new role and the data schemas it is authoritative for.'}
          </DialogDescription>
        </DialogHeader>

        {areSchemasLoading ? (
          <div className="py-8"><Loading text="Loading options..." /></div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label>Authoritative Schemas</Label>
              <MultiSelect
                options={schemaOptions}
                selected={selectedSchemas}
                onChange={setSelectedSchemas}
                placeholder="Add schemas this role can provide..."
              />
               <p className="text-xs text-muted-foreground">
                These are the data types institutions with this role can issue.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving...' : 'Save Role'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
