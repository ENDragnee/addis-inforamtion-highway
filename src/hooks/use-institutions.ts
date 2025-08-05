import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'; // THE FIX: Import keepPreviousData
import axios from 'axios';
import toast from 'react-hot-toast';
import { Institution as PrismaInstitution, InstitutionStatus, Role } from '@/generated/prisma/client';

// --- Type Definitions ---
export type Institution = PrismaInstitution & {
  role: Role;
};

export type PaginatedInstitutions = {
  data: Institution[];
  meta: { total: number; page: number; limit: number; totalPages: number; };
};

export type UpsertInstitutionPayload = {
  id?: string;
  name: string;
  roleId: string;
  apiEndpoint: string;
  publicKey: string;
  clientSecret?: string;
};

export type UpdateStatusPayload = {
  id: string;
  status: InstitutionStatus;
};

export type InstitutionFilters = {
  page: number;
  limit: number;
  search: string;
  status: InstitutionStatus | 'all';
};

// --- API Functions ---
const fetchInstitutions = async (filters: InstitutionFilters): Promise<PaginatedInstitutions> => {
  const { data } = await axios.get('/api/v1/super/institutions', {
    params: filters,
  });
  return data;
};

const upsertInstitution = async (payload: UpsertInstitutionPayload): Promise<Institution> => {
  const { id, ...data } = payload;
  const method = id ? 'patch' : 'post';
  const url = id ? `/api/v1/super/institutions/${id}` : `/api/v1/super/institutions`;
  const response = await axios[method](url, data);
  return response.data;
};

const updateInstitutionStatus = async ({ id, status }: UpdateStatusPayload): Promise<Institution> => {
    const response = await axios.patch(`/api/v1/super/institutions/${id}`, { status });
    return response.data;
}

// --- React Query Hooks ---
export const useGetInstitutions = (filters: InstitutionFilters) => {
  return useQuery<PaginatedInstitutions, Error>({
    // The query key now includes all filters to ensure uniqueness
    queryKey: ['institutions', filters],
    queryFn: () => fetchInstitutions(filters),
    placeholderData: keepPreviousData,
  });
};

export const useUpsertInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation<Institution, Error, UpsertInstitutionPayload>({
    mutationFn: upsertInstitution,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      const action = variables.id ? 'updated' : 'created';
      toast.success(`Institution "${data.name}" ${action} successfully.`);
    },
    // THE FIX: Corrected the unterminated string literal.
    onError: (error: any) => toast.error(error.response?.data?.error || 'An error occurred.'),
  });
};

export const useUpdateInstitutionStatus = () => {
    const queryClient = useQueryClient();
    return useMutation<Institution, Error, UpdateStatusPayload>({
        mutationFn: updateInstitutionStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['institutions']});
            toast.success('Institution status updated.');
        },
        // THE FIX: Corrected the unterminated string literal.
        onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update status.'),
    });
}
