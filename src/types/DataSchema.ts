import { Relationship } from "./Relationship";
import { DataRequest } from "./DataRequest";

export interface DataSchema {
  id: string;
  schemaId: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  relationships: Relationship[];
  dataRequests: DataRequest[];
}
