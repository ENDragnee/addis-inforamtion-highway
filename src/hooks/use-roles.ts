import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Role as PrismaRole, DataSchema } from '@/generated/prisma/client';

export type Role = {
  id: string;
  name: string;
  description: string;
  institutionCount: number;
};

export type RoleWithDetails = PrismaRole & {
  institutionCount: number;
  dataSchemas: Pick<DataSchema, 'id' | 'schemaId' | 'description'>[];
};

export type PaginatedRoles = {
  data: RoleWithDetails[];
  meta: { total: number; page: number; limit: number; totalPages: number; };
};

export type RoleFilters = {
  page: number;
  limit: number;
  search: string;
};

// THE FIX (Part 2): Update the payload to include the new dataSchemaIds array.
type UpsertRolePayload = {
  id?: string;
  name: string;
  description?: string;
  dataSchemaIds: string[]; // This is now a required part of the payload
};

// --- API Functions using Axios ---

const fetchRoles = async (filters: RoleFilters): Promise<PaginatedRoles> => {
  const { data } = await axios.get('/api/v1/super/roles', { params: filters });
  return data;
};

const upsertRole = async (payload: UpsertRolePayload): Promise<PrismaRole> => {
  const { id, ...data } = payload;
  const method = id ? 'patch' : 'post';
  const url = id ? `/api/v1/super/roles/${id}` : '/api/v1/super/roles';
  const response = await axios[method](url, data);
  return response.data;
};

const deleteRole = async (roleId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api/v1/super/roles/${roleId}`);
  return response.data;
};

// --- React Query Hooks ---

export const useGetRoles = (filters: RoleFilters) => {
  return useQuery<PaginatedRoles, Error>({
    queryKey: ['roles', filters],
    queryFn: () => fetchRoles(filters),
    placeholderData: keepPreviousData,
  });
};

export const useUpsertRole = () => {
  const queryClient = useQueryClient();
  return useMutation<PrismaRole, Error, UpsertRolePayload>({
    mutationFn: upsertRole,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      const action = variables.id ? 'updated' : 'created';
      toast.success(`Role "${data.name}" ${action} successfully.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'An error occurred.');
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete role.');
    },
  });
};
