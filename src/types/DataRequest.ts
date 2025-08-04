import { Institution } from "./Institution";
import { User } from "./User";
import { DataSchema } from "./DataSchema";
import { Relationship } from "./Relationship";
import { DataRequestStatus } from "./enums";

export interface DataRequest {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  requesterId: string;
  requester: Institution;
  providerId: string;
  provider: Institution;
  dataOwnerId: string;
  dataOwner: User;
  dataSchemaId: string;
  dataSchema: DataSchema;
  relationshipId: string;
  relationship: Relationship;
  status: DataRequestStatus;
  consentTokenJti?: string | null;
  expiresAt: Date;
  failureReason?: string | null;
  signatures: DataRequestSignature[];
  dataHash?: string | null;
}

export interface DataRequestSignature {
  id: string;
  dataRequestId: string;
  type: SignatureType;
  signature: string;
  createdAt: Date;
}

export enum SignatureType {
  REQUESTER = "REQUESTER",
  PLATFORM = "PLATFORM",
  PROVIDER = "PROVIDER",
}
