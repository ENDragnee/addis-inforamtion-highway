"use client";

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { PlusCircle, Trash2 } from 'lucide-react';

const formSchema = z.object({
  schemaId: z.string().min(3, 'Schema ID must be at least 3 characters (e.g., salary_v1)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  parameters: z.array(z.object({
    key: z.string().min(1, 'Field name is required.'),
    value: z.string().min(1, 'Field type is required.'),
  })),
});

type FormData = z.infer<typeof formSchema>;

interface SchemaFormProps {
  schema: SchemaWithCount | null;
  onClose: () => void;
  isOpen: boolean;
}

export default function SchemaForm({ schema, onClose, isOpen }: SchemaFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schemaId: '',
      description: '',
      parameters: [{ key: '', value: '' }],
    },
  });

  // useFieldArray is the recommended way to manage dynamic form fields with react-hook-form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parameters",
  });

  const upsertMutation = useUpsertSchema();

  // Populate the form with data when editing an existing schema
  useEffect(() => {
    if (isOpen) {
      if (schema) {
        // Transform the JSON object from Prisma into the array format for the form
        const paramsArray = schema.parameters && typeof schema.parameters === 'object' && !Array.isArray(schema.parameters)
          ? Object.entries(schema.parameters).map(([key, value]) => ({ key, value: String(value) }))
          : [];
        
        reset({
          schemaId: schema.schemaId,
          description: schema.description,
          parameters: paramsArray.length > 0 ? paramsArray : [{ key: '', value: '' }],
        });
      } else {
        // Reset to default for creation
        reset({ schemaId: '', description: '', parameters: [{ key: '', value: '' }] });
      }
    }
  }, [schema, isOpen, reset]);

  const onSubmit = (data: FormData) => {
    // Transform the form's array of parameters back into a JSON object for the database
    const parametersObject = data.parameters.reduce((acc, param) => {
      if (param.key) {
        acc[param.key] = param.value;
      }
      return acc;
    }, {} as Record<string, string>);

    upsertMutation.mutate({ 
      id: schema?.id, 
      schemaId: data.schemaId,
      description: data.description,
      parameters: parametersObject,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{schema ? 'Edit Schema' : 'Add New Schema'}</DialogTitle>
          <DialogDescription>
            Define the unique ID, description, and data parameters for this schema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="space-y-2">
              <Label htmlFor="schemaId">Schema ID (URN)</Label>
              <Input id="schemaId" placeholder="e.g., salary_verification_v1" {...register('schemaId')} />
              {errors.schemaId && <p className="text-xs text-destructive">{errors.schemaId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A short, clear description..." {...register('description')} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            
            {/* Dynamic Parameters Section */}
            <div className="space-y-2">
              <Label>Schema Parameters</Label>
              <div className="space-y-2 rounded-md border p-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Field Name (e.g., fullName)" {...register(`parameters.${index}.key`)} />
                      {errors.parameters?.[index]?.key && <p className="text-xs text-destructive">{errors.parameters[index]?.key?.message}</p>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Field Type (e.g., string)" {...register(`parameters.${index}.value`)} />
                       {errors.parameters?.[index]?.value && <p className="text-xs text-destructive">{errors.parameters[index]?.value?.message}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="bottom-0 bg-background pt-4 border-t -mx-6 px-6">
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
