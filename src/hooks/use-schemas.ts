import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DataSchema } from '@/generated/prisma/client';

export type Schema = DataSchema;
// --- Type Definitions ---
// The type returned by our GET list endpoint
export type SchemaWithCount = DataSchema & {
  relationshipCount: number;
};

// The payload for creating or updating a schema
type UpsertSchemaPayload = {
  id?: string;
  schemaId: string;
  description: string;
};

// --- API Functions using Axios ---

const fetchSchemas = async (): Promise<SchemaWithCount[]> => {
  const { data } = await axios.get('/api/v1/super/schemas');
  return data.data;
};

const upsertSchema = async (payload: UpsertSchemaPayload): Promise<DataSchema> => {
  const { id, ...data } = payload;
  const method = id ? 'patch' : 'post';
  const url = id ? `/api/v1/super/schemas/${id}` : '/api/v1/super/schemas';
  const response = await axios[method](url, data);
  return response.data;
};

const deleteSchema = async (schemaId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/v1/super/schemas/${schemaId}`);
  return response.data;
};

// --- React Query Hooks ---

/**
 * Hook to fetch all data schemas with their relationship counts.
 */
export const useGetSchemas = () => {
  return useQuery<SchemaWithCount[], Error>({
    queryKey: ['schemas'],
    queryFn: fetchSchemas,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook for creating or updating a data schema.
 */
export const useUpsertSchema = () => {
  const queryClient = useQueryClient();
  return useMutation<DataSchema, Error, UpsertSchemaPayload>({
    mutationFn: upsertSchema,
    onSuccess: (data, variables) => {
      // Invalidate the 'schemas' query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      const action = variables.id ? 'updated' : 'created';
      toast.success(`Schema "${data.schemaId}" ${action} successfully.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'An error occurred.');
    },
  });
};

/**
 * Hook for deleting a data schema.
 */
export const useDeleteSchema = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteSchema,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete schema.');
    },
  });
};
