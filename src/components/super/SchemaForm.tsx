"use client"

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpsertSchema, SchemaWithCount } from '@/hooks/use-schemas';

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Define the form's validation schema using Zod
const formSchema = z.object({
  schemaId: z.string().min(3, 'Schema ID must be at least 3 characters (e.g., salary_v1)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface SchemaFormProps {
  schema: SchemaWithCount | null;
  onClose: () => void;
  isOpen: boolean;
}

export default function SchemaForm({ schema, onClose, isOpen }: SchemaFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const upsertMutation = useUpsertSchema();

  // Populate the form with data when editing an existing schema
  useEffect(() => {
    if (schema) {
      reset({ schemaId: schema.schemaId, description: schema.description });
    } else {
      reset({ schemaId: '', description: '' });
    }
  }, [schema, isOpen, reset]);

  const onSubmit = (data: FormData) => {
    upsertMutation.mutate({ id: schema?.id, ...data }, {
      onSuccess: () => onClose(), // Close the dialog on successful mutation
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{schema ? 'Edit Schema' : 'Add New Schema'}</DialogTitle>
          <DialogDescription>
            {schema ? `Editing details for ${schema.schemaId}.` : 'Define a new data schema for the network.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schemaId">Schema ID (URN)</Label>
            <Input
              id="schemaId"
              placeholder="e.g., salary_verification_v1"
              {...register('schemaId')}
            />
            {errors.schemaId && <p className="text-xs text-destructive">{errors.schemaId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A short, clear description of what this schema represents."
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving...' : 'Save Schema'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
