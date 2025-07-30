import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return !!token;
    },
  },
});

// The `matcher` specifies which routes this middleware should run on.
export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all routes under /dashboard
  ],
};
