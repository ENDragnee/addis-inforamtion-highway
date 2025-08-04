import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

// Create a new DataSchema
export async function createDataSchema(data: Prisma.DataSchemaCreateInput) {
  return prisma.dataSchema.create({ data });
}

// Get a DataSchema by its ID
export async function getDataSchemaById(id: string) {
  return prisma.dataSchema.findUnique({ where: { id }, include: { relationships: true, dataRequests: true } });
}

// Get a DataSchema by its schemaId
export async function getDataSchemaBySchemaId(schemaId: string) {
  return prisma.dataSchema.findUnique({ where: { schemaId }, include: { relationships: true, dataRequests: true } });
}

// Update a DataSchema
export async function updateDataSchema(id: string, data: Prisma.DataSchemaUpdateInput) {
  return prisma.dataSchema.update({ where: { id }, data });
}

// Delete a DataSchema
export async function deleteDataSchema(id: string) {
  return prisma.dataSchema.delete({ where: { id } });
}

// List all DataSchemas
export async function listAllDataSchemas() {
  return prisma.dataSchema.findMany({ include: { relationships: true, dataRequests: true } });
}

// List DataSchemas available for a given Role (by roleId)
export async function listDataSchemasForRole(roleId: string) {
  // Find all relationships where the role is requester or provider, then get unique dataSchemas
  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { requesterRoleId: roleId },
        { providerRoleId: roleId }
      ],
      status: 'ACTIVE',
    },
    include: { dataSchema: true },
  });
  // Return unique dataSchemas
  const seen = new Set<string>();
  return relationships
    .map(r => r.dataSchema)
    .filter(ds => {
      if (seen.has(ds.id)) return false;
      seen.add(ds.id);
      return true;
    });
}

// List DataSchemas for a given Relationship
export async function listDataSchemasForRelationship(relationshipId: string) {
  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    include: { dataSchema: true },
  });
  return relationship ? [relationship.dataSchema] : [];
}
