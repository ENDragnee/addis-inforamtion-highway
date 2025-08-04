import { Role } from "./Role";
import { DataRequest } from "./DataRequest";

export interface Institution {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  roleId: string;
  role: Role;
  clientId: string;
  publicKey: string;
  apiEndpoint: string;
  requestsMade: DataRequest[];
  requestsReceived: DataRequest[];
}
