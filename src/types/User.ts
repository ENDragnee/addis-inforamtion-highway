import { DataRequest } from "./DataRequest";

export interface User {
  id: string;
  externalId: string;
  verifaydaSub?: string | null;
  fcmToken?: string | null;
  pushToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  dataRequests: DataRequest[];
}
