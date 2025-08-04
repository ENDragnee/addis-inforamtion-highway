import { Institution } from "./Institution";
import { Relationship } from "./Relationship";

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  institutions: Institution[];
  requesterRelations: Relationship[];
  providerRelations: Relationship[];
}
