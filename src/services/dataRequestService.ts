import prisma from '@/lib/prisma';
import { Prisma, DataRequestStatus, SignatureType } from '@/generated/prisma/client';

// Create a new DataRequest
export async function createDataRequest(data: Prisma.DataRequestCreateInput) {
  return prisma.dataRequest.create({ data });
}

// Get a DataRequest by its ID
export async function getDataRequestById(id: string) {
  return prisma.dataRequest.findUnique({
    where: { id },
    include: { requester: true, provider: true, dataOwner: true, dataSchema: true, relationship: true, signatures: true },
  });
}

// Update a DataRequest
export async function updateDataRequest(id: string, data: Prisma.DataRequestUpdateInput) {
  return prisma.dataRequest.update({ where: { id }, data });
}

// Delete a DataRequest
export async function deleteDataRequest(id: string) {
  return prisma.dataRequest.delete({ where: { id } });
}

// List all DataRequests (optionally filter by status, institution, user, etc.)
export async function listDataRequests(filter: Partial<{
  status: DataRequestStatus;
  requesterId: string;
  providerId: string;
  dataOwnerId: string;
  relationshipId: string;
}> = {}) {
  return prisma.dataRequest.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.requesterId ? { requesterId: filter.requesterId } : {}),
      ...(filter.providerId ? { providerId: filter.providerId } : {}),
      ...(filter.dataOwnerId ? { dataOwnerId: filter.dataOwnerId } : {}),
      ...(filter.relationshipId ? { relationshipId: filter.relationshipId } : {}),
    },
    include: { requester: true, provider: true, dataOwner: true, dataSchema: true, relationship: true, signatures: true },
  });
}

// Move DataRequest to a new status (enforces state machine rules)
export async function transitionDataRequestStatus(id: string, newStatus: DataRequestStatus, failureReason?: string) {
  const dataRequest = await prisma.dataRequest.findUnique({ where: { id } });
  if (!dataRequest) throw new Error('DataRequest not found');
  // State machine rules (example)
  const validTransitions: Record<DataRequestStatus, DataRequestStatus[]> = {
    INITIATED: ['AWAITING_CONSENT', 'FAILED'],
    AWAITING_CONSENT: ['APPROVED', 'DENIED', 'FAILED'],
    APPROVED: ['COMPLETED', 'FAILED'],
    DENIED: [],
    COMPLETED: [],
    FAILED: [],
    EXPIRED: [],
  };
  if (!validTransitions[dataRequest.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${dataRequest.status} to ${newStatus}`);
  }
  return prisma.dataRequest.update({
    where: { id },
    data: {
      status: newStatus,
      ...(failureReason ? { failureReason } : {}),
    },
  });
}

// Check and expire DataRequests past their expiry
export async function expireStaleDataRequests() {
  const now = new Date();
  return prisma.dataRequest.updateMany({
    where: {
      expiresAt: { lt: now },
      status: { in: ['INITIATED', 'AWAITING_CONSENT', 'APPROVED'] },
    },
    data: { status: 'EXPIRED' },
  });
}

// Add a signature to a DataRequest (audit trail)
export async function addDataRequestSignature(dataRequestId: string, type: SignatureType, signature: string) {
  return prisma.dataRequestSignature.create({
    data: {
      dataRequestId,
      type,
      signature,
    },
  });
}

// List all signatures for a DataRequest
export async function listDataRequestSignatures(dataRequestId: string) {
  return prisma.dataRequestSignature.findMany({ where: { dataRequestId } });
}
