import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

// Create a new Role
export async function createRole(data: Prisma.RoleCreateInput) {
  return prisma.role.create({ data });
}

// Get a Role by its ID
export async function getRoleById(id: string) {
  return prisma.role.findUnique({ where: { id }, include: { institutions: true, requesterRelations: true, providerRelations: true } });
}

// Get a Role by its name
export async function getRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name }, include: { institutions: true, requesterRelations: true, providerRelations: true } });
}

// Update a Role
export async function updateRole(id: string, data: Prisma.RoleUpdateInput) {
  return prisma.role.update({ where: { id }, data });
}

// Delete a Role
export async function deleteRole(id: string) {
  return prisma.role.delete({ where: { id } });
}

// List all Roles
export async function listAllRoles() {
  return prisma.role.findMany({ include: { institutions: true, requesterRelations: true, providerRelations: true } });
}

// List Roles that can be a requester in any relationship
export async function listRequesterRoles() {
  return prisma.role.findMany({ where: { requesterRelations: { some: {} } } });
}

// List Roles that can be a provider in any relationship
export async function listProviderRoles() {
  return prisma.role.findMany({ where: { providerRelations: { some: {} } } });
}
