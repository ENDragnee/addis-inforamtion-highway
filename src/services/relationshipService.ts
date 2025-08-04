import prisma from '@/lib/prisma';
import { Prisma, RelationshipStatus } from '@/generated/prisma/client';

// Create a new Relationship (enforces unique tuple)
export async function createRelationship(data: Prisma.RelationshipCreateInput) {
  // Throws if unique constraint is violated
  return prisma.relationship.create({ data });
}

// Get a Relationship by its ID
export async function getRelationshipById(id: string) {
  return prisma.relationship.findUnique({ where: { id }, include: { requesterRole: true, providerRole: true, dataSchema: true, dataRequests: true } });
}

// Update a Relationship
export async function updateRelationship(id: string, data: Prisma.RelationshipUpdateInput) {
  return prisma.relationship.update({ where: { id }, data });
}

// Delete a Relationship
export async function deleteRelationship(id: string) {
  return prisma.relationship.delete({ where: { id } });
}

// Set Relationship status (PENDING, ACTIVE, REJECTED, REVOKED)
export async function setRelationshipStatus(id: string, status: RelationshipStatus) {
  return prisma.relationship.update({ where: { id }, data: { status } });
}

// Find a Relationship by tuple (requesterRoleId, providerRoleId, dataSchemaId)
export async function findRelationship(requesterRoleId: string, providerRoleId: string, dataSchemaId: string) {
  return prisma.relationship.findUnique({
    where: {
      requesterRoleId_providerRoleId_dataSchemaId: {
        requesterRoleId,
        providerRoleId,
        dataSchemaId,
      },
    },
    include: { requesterRole: true, providerRole: true, dataSchema: true, dataRequests: true },
  });
}

// List Relationships with optional filters
export async function listRelationships({ requesterRoleId, providerRoleId, dataSchemaId, status }: {
  requesterRoleId?: string;
  providerRoleId?: string;
  dataSchemaId?: string;
  status?: RelationshipStatus;
} = {}) {
  return prisma.relationship.findMany({
    where: {
      ...(requesterRoleId ? { requesterRoleId } : {}),
      ...(providerRoleId ? { providerRoleId } : {}),
      ...(dataSchemaId ? { dataSchemaId } : {}),
      ...(status ? { status } : {}),
    },
    include: { requesterRole: true, providerRole: true, dataSchema: true, dataRequests: true },
  });
}
