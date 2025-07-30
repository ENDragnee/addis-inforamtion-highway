import { InstitutionUserRole, SuperUserRole } from '@/generated/prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Define a type for the user object returned from the authorize callback
type AuthorizeUser = {
  id: string;
  name: string;
  email: string;
  type: 'SUPER_USER' | 'INSTITUTION_USER';
  // Optional fields depending on user type
  institutionId?: string;
  institutionRole?: InstitutionUserRole;
  superUserRole?: SuperUserRole;
}

// Extend the built-in session and JWT types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      type: 'SUPER_USER' | 'INSTITUTION_USER';
      // For SuperUsers
      superUserRole?: SuperUserRole;
      // For InstitutionUsers
      institutionId?: string;
      institutionRole?: InstitutionUserRole;
    } & DefaultSession['user'];
  }

  // Pass the full AuthorizeUser object into the `user` property of the `jwt` callback
  interface User extends AuthorizeUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    type: 'SUPER_USER' | 'INSTITUTION_USER';
    // For SuperUsers
    superUserRole?: SuperUserRole;
    // For InstitutionUsers
    institutionId?: string;
    institutionRole?: InstitutionUserRole;
  }
}
