import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

// Create a new Institution
export async function createInstitution(data: Prisma.InstitutionCreateInput) {
  return prisma.institution.create({ data });
}

// Get an Institution by its ID
export async function getInstitutionById(id: string) {
  return prisma.institution.findUnique({ where: { id }, include: { requestsMade: true, requestsReceived: true, role: true } });
}

// Get an Institution by its clientId
export async function getInstitutionByClientId(clientId: string) {
  return prisma.institution.findUnique({ where: { clientId }, include: { requestsMade: true, requestsReceived: true, role: true } });
}

// Get an Institution by its public key
export async function getInstitutionByPublicKey(publicKey: string) {
  return prisma.institution.findFirst({ where: { publicKey }, include: { requestsMade: true, requestsReceived: true, role: true } });
}

// Update an Institution
export async function updateInstitution(id: string, data: Prisma.InstitutionUpdateInput) {
  return prisma.institution.update({ where: { id }, data });
}

// Delete an Institution
export async function deleteInstitution(id: string) {
  return prisma.institution.delete({ where: { id } });
}

// List all Institutions
export async function listAllInstitutions() {
  return prisma.institution.findMany({ include: { requestsMade: true, requestsReceived: true, role: true } });
}

// Get all requests "owned" by an institution (as requester or provider)
export async function getOwnedRequests(institutionId: string) {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: {
      requestsMade: true,
      requestsReceived: true,
    },
  });
  return {
    requestsMade: institution?.requestsMade ?? [],
    requestsReceived: institution?.requestsReceived ?? [],
  };
}
