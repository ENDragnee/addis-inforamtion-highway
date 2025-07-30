// app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if needed

// The handler initializes NextAuth.js with your configurations
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests as required by NextAuth.js
export { handler as GET, handler as POST };
