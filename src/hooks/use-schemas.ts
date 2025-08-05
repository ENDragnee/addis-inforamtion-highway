import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DataSchema } from '@/generated/prisma/client';

export type Schema = DataSchema;

export type SchemaWithCount = Schema & {
  relationshipCount: number;
};

export type SchemaFilters = {
  page: number;
  limit: number;
  search: string;
  sort: string;
};

type UpsertSchemaPayload = {
  id?: string;
  schemaId: string;
  description: string;
  parameters: Record<string, string>;
};

export type PaginatedSchemas = {
  data: SchemaWithCount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const fetchSchemas = async (filters: SchemaFilters): Promise<PaginatedSchemas> => {
  const { data } = await axios.get('/api/v1/super/schemas', { params: filters });
  return data;
};

const upsertSchema = async (payload: UpsertSchemaPayload): Promise<DataSchema> => {
  const { id, ...data } = payload;
  const method = id ? 'patch' : 'post';
  const url = id ? `/api/v1/super/schemas/${id}` : '/api/v1/super/schemas';
  const response = await axios[method](url, data);
  return response.data.data;
};

const deleteSchema = async (schemaId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/v1/super/schemas/${schemaId}`);
  return response.data;
};

export const useGetSchemas = (filters: SchemaFilters) => {
  return useQuery<PaginatedSchemas, Error>({
    queryKey: ['schemas', filters],
    queryFn: () => fetchSchemas(filters),
    placeholderData: keepPreviousData,
  });
};

export const useUpsertSchema = () => {
  const queryClient = useQueryClient();
  return useMutation<DataSchema, Error, UpsertSchemaPayload>({
    mutationFn: upsertSchema,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      const action = variables.id ? 'updated' : 'created';
      toast.success(`Schema "${data.schemaId}" ${action} successfully.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'An error occurred.');
    },
  });
};

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
