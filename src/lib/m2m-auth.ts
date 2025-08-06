import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Assuming you have these crypto functions defined elsewhere
// import { canonicalizeBody, verifySignature } from './crypto';
import { Institution } from '@/generated/prisma/client';
import { verifySignature } from './crypto';

// Helper for crypto functions (add these if you don't have them)
function canonicalizeBody(body: any): string {
  if (!body) return '';
  return JSON.stringify(body, Object.keys(body).sort());
}


// Define the shape of the authenticated request
export interface AuthenticatedRequest extends NextRequest {
  institution: Institution;
  signature: string; // Optional, if you want to access the signature directly
}

// THE FIX (Part 1): Update the handler type to accept additional arguments.
// `...args: any[]` allows it to accept zero or more additional arguments.
type AuthenticatedHandler = (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * A middleware wrapper for Next.js App Router API routes that enforces
 * M2M (Machine-to-Machine) authentication via digital signatures.
 *
 * @param handler The API route handler to execute upon successful authentication.
 * @returns A new request handler that includes the authentication check.
 */
export function withM2MAuth(handler: AuthenticatedHandler) {
  // THE FIX (Part 2): The returned function also accepts additional arguments.
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const clientId = request.headers.get('Client-Id');
      const signatureHeader = request.headers.get('Signature');

      if (!clientId || !signatureHeader) {
        return NextResponse.json({ error: 'Missing x-client-id or x-signature header' }, { status: 401 });
      }

      const institution = await prisma.institution.findUnique({
        where: { clientId },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 401 });
      }

      // Clone the request to read the body
      const requestClone = request.clone();
      const body = await requestClone.text(); // Use .text() for more robust empty body handling

      const isValid = verifySignature(
        institution.clientId,
        signatureHeader,
        institution.publicKey
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.institution = institution;
      authenticatedRequest.signature = signatureHeader;

      // THE FIX (Part 3): Spread the additional arguments when calling the final handler.
      // This will correctly pass the `{ params }` object for dynamic routes.
      return await handler(authenticatedRequest, ...args);

    } catch (err: any) {
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      console.error('M2M Auth Middleware Error:', err);
      return NextResponse.json({ error: 'Internal server authentication error' }, { status: 500 });
    }
  };
}
