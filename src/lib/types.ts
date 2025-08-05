import { Edge } from '@xyflow/react';

export type AppEdge = Edge<{ status: string, label?: string, proposedBy?: string }>;

export enum InstitutionStatus {
  Active = 'Active',
  Suspended = 'Suspended',
}

export type Institution = {
  id: string;
  name: string;
  status: InstitutionStatus;
  role: string;
  clientId: string;
  apiEndpoint: string;
  // Add other fields as they become relevant
};

export type DataSchema = {
  id: string
  schemaUrn: string
  description: string
  issuerRole: Role;
  jsonSchema?: string; // Optional JSON schema definition
}

export type Role = {
  id: string;
  name: string;
};
