import { SuperUserRole } from "./enums";

export interface SuperUser {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  role: SuperUserRole;
  createdAt: Date;
  updatedAt: Date;
}
