// @/lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/password-utils';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.toLowerCase();

        // 1. Check for SuperUser
        const superUser = await prisma.superUser.findUnique({
          where: { email },
        });

        if (superUser) {
          // UPDATED (SuperUser check): Use the verifyPassword utility function
          const isPasswordValid = await verifyPassword(
            credentials.password,
            superUser.hashedPassword
          );
          if (isPasswordValid) {
            return {
              id: superUser.id,
              email: superUser.email,
              name: superUser.name,
              type: 'SUPER_USER',
              superUserRole: superUser.role,
            };
          }
        }
        
        // 2. Check for InstitutionUser
        const institutionUser = await prisma.institutionUser.findUnique({
          where: { email },
        });

        if (institutionUser) {
          // UPDATED (InstitutionUser check): Use the verifyPassword utility function
          const isPasswordValid = await verifyPassword(
            credentials.password,
            institutionUser.hashedPassword
          );
          if (isPasswordValid) {
            return {
              id: institutionUser.id,
              email: institutionUser.email,
              name: institutionUser.name,
              type: 'INSTITUTION_USER',
              institutionId: institutionUser.institutionId,
              institutionRole: institutionUser.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        if (user.type === 'SUPER_USER') {
          token.superUserRole = user.superUserRole;
        } else if (user.type === 'INSTITUTION_USER') {
          token.institutionId = user.institutionId;
          token.institutionRole = user.institutionRole;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        if (token.type === 'SUPER_USER') {
          session.user.superUserRole = token.superUserRole;
        } else if (token.type === 'INSTITUTION_USER') {
          session.user.institutionId = token.institutionId;
          session.user.institutionRole = token.institutionRole;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
