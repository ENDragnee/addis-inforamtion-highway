import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Institution } from '@/generated/prisma/client'; // Use the direct Prisma client type
import { verifySignature } from './crypto';

/**
 * Defines the shape of the request object after it has passed authentication.
 * The final API handler will receive this, giving it strongly-typed access
 * to the authenticated institution.
 */
export interface AuthenticatedRequest extends NextRequest {
  institution: Institution;
}

/**
 * A type definition for the API route handlers that will be protected by this middleware.
 * It accepts the augmented request and any other route parameters (like `params`).
 */
type AuthenticatedHandler = (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * A middleware wrapper for Next.js App Router API routes that enforces
 * M2M (Machine-to-Machine) authentication by verifying a digital signature.
 *
 * This middleware expects two headers on incoming requests:
 * 1. `Client-Id`: The unique ID of the calling institution.
 * 2. `Signature`: A Base64-encoded RSA-SHA256 signature of the full request body.
 *
 * @param handler The API route handler to execute upon successful authentication.
 * @returns A new request handler that includes the authentication check.
 */
export function withM2MAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // 1. Extract credentials from headers
      const clientId = request.headers.get('Client-Id');
      const signatureHeader = request.headers.get('Signature');

      if (!clientId || !signatureHeader) {
        return NextResponse.json({ error: 'Missing Client-Id or Signature header' }, { status: 401 });
      }

      // 2. Find the institution in the database using the Client ID
      const institution = await prisma.institution.findUnique({
        where: { clientId },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 401 });
      }

      // 3. Get the request body to verify the signature against
      // We MUST clone the request to read its body, as the body stream can only be
      // consumed once. The original `request` object is passed to the handler intact.
      const requestClone = request.clone();
      const body = await requestClone.json(); // Assumes all signed requests have a JSON body

      // 4. Verify the signature
      // This is the core logic that matches the SDK's signing process.
      // It verifies the signature from the header against the request body,
      // using the institution's public key stored in the database.
      const isValid = verifySignature(
        body,
        signatureHeader,
        institution.publicKey
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // 5. Authentication successful: Augment the request and proceed
      // Cast the request to our custom type and attach the full institution object.
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.institution = institution;

      // Pass the augmented request and any route params (like `{ params }`) to the actual API handler.
      return await handler(authenticatedRequest, ...args);

    } catch (err: any) {
      // Handle potential errors, such as a malformed JSON body
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      console.error('M2M Auth Middleware Error:', err);
      return NextResponse.json({ error: 'Internal server authentication error' }, { status: 500 });
    }
  };
}
