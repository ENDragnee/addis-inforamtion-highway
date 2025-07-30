import { InstitutionUserRole, SuperUserRole } from '@/generated/prisma/client';
import { type DefaultSession, type DefaultUser } from 'next-auth';

type AuthorizeUser = {
  id: string;
  name: string;
  email: string;
  type: 'SUPER_USER' | 'INSTITUTION_USER';
  institutionId?: string;
  institutionRole?: InstitutionUserRole;
  superUserRole?: SuperUserRole;
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      type: 'SUPER_USER' | 'INSTITUTION_USER';
      superUserRole?: SuperUserRole;
      institutionId?: string;
      institutionRole?: InstitutionUserRole;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string; 
    type: 'SUPER_USER' | 'INSTITUTION_USER';
    institutionId?: string;
    institutionRole?: InstitutionUserRole;
    superUserRole?: SuperUserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    type: 'SUPER_USER' | 'INSTITUTION_USER';
    superUserRole?: SuperUserRole;
    institutionId?: string;
    institutionRole?: InstitutionUserRole;
  }
}
