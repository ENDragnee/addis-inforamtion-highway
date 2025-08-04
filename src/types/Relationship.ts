import { Role } from "./Role";
import { DataSchema } from "./DataSchema";
import { DataRequest } from "./DataRequest";
import { RelationshipStatus } from "./enums";

export interface Relationship {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: RelationshipStatus;
  requesterRoleId: string;
  requesterRole: Role;
  providerRoleId: string;
  providerRole: Role;
  dataSchemaId: string;
  dataSchema: DataSchema;
  dataRequests: DataRequest[];
}
