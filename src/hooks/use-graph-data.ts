import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { RelationshipStatus } from '@/generated/prisma/client';

// --- Type Definitions ---
export type GraphNode = Node<{ label: string; role: string }>;
export type GraphEdge = Edge<{ status: string; description: string; requesterName: string; providerName: string }>;
type CreateRelationshipPayload = { requesterRoleId: string; providerRoleId: string; dataSchemaId: string; };

type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type UpdateStatusPayload = {
  id: string;
  status: RelationshipStatus;
};

// --- API Functions using Axios ---
const fetchGraphData = async (): Promise<GraphData> => {
  const { data } = await axios.get('/api/v1/super/graph-data');
  
  return {
    ...data,
    edges: data.edges.map((edge: any) => ({
      // Base properties are passed through
      id: edge.id,
      source: edge.source,
      target: edge.target,
      
      // `label` is a top-level property for React Flow
      label: edge.label,
      
      // THE KEY: `type` must be set for React Flow's internal logic
      type: edge.data?.status?.toLowerCase() || 'default',

      // `data` holds our custom metadata
      data: {
        status: edge.data?.status || 'default', // This is what our CustomEdge component reads
        description: edge.data?.description,
        requesterName: edge.data?.requesterName,
        providerName: edge.data?.providerName,
      },
      
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    }))
  };
};

const updateRelationshipStatus = async ({ id, status }: UpdateStatusPayload) => {
  const { data } = await axios.patch(`/api/v1/super/relationships/${id}`, { status });
  return data;
};

const deleteRelationship = async (id: string) => {
  const { data } = await axios.delete(`/api/v1/super/relationships/${id}`);
  return data;
};

const createRelationship = async (payload: CreateRelationshipPayload) => {
  const { data } = await axios.post('/api/v1/super/relationships', payload);
  return data;
};

// --- React Query Hooks ---
export const useGetGraphData = () => {
  return useQuery<GraphData, Error>({
    queryKey: ['graphData'],
    queryFn: fetchGraphData,
  });
};

export const useUpdateRelationshipStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRelationshipStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['graphData'] });
      toast.success(data.message || 'Relationship updated!');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Update failed.'),
  });
};

export const useDeleteRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRelationship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['graphData'] });
      toast.success(data.message || 'Relationship deleted!');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Deletion failed.'),
  });
};

export const useCreateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelationship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['graphData'] });
      toast.success(data.message || 'Relationship created!');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Creation failed.'),
  });
};
