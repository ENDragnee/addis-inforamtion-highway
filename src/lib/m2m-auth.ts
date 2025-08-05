import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canonicalizeBody, verifySignature } from './crypto';
import { Institution } from '@/generated/prisma/client'; // Import the type for better safety

// Define the shape of the authenticated request that will be passed to the handler
export interface AuthenticatedRequest extends NextRequest {
  institution: Institution;
}

// Define the type for the handler function that the wrapper will accept
type AuthenticatedHandler = (req: AuthenticatedRequest) => Promise<NextResponse>;

/**
 * A middleware wrapper for Next.js App Router API routes that enforces
 * M2M (Machine-to-Machine) authentication via digital signatures.
 *
 * @param handler The API route handler to execute upon successful authentication.
 * @returns A new request handler that includes the authentication check.
 */
export function withM2MAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Extract headers
      // Header names are case-insensitive, so we use lowercase.
      const clientId = request.headers.get('x-client-id');
      const signatureHeader = request.headers.get('x-signature');

      if (!clientId || !signatureHeader) {
        return NextResponse.json(
          { error: 'Missing x-client-id or x-signature header' },
          { status: 401 }
        );
      }

      // 2. Lookup institution by clientId
      const institution = await prisma.institution.findUnique({
        where: { clientId },
      });

      if (!institution) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 401 });
      }

      // 3. Handle the request body for signature verification
      // In the App Router, a request body can only be read once. To allow both
      // this middleware and the final handler to access it, we must clone the request.
      const requestClone = request.clone();
      const body = await requestClone.json();
      
      // Create a deterministic string representation of the body
      const canonicalBody = canonicalizeBody(body);

      // 4. Verify the signature
      const isValid = verifySignature(
        canonicalBody,
        signatureHeader,
        institution.publicKey
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // 5. Authentication successful.
      // We create an "augmented" request object that includes the authenticated institution.
      // This is a common pattern to pass context from middleware to the handler.
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.institution = institution;

      // 6. Invoke the actual API route handler with the augmented request.
      return await handler(authenticatedRequest);

    } catch (err: any) {
      // Handle potential errors like malformed JSON in the request body.
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      console.error('M2M Auth Middleware Error:', err);
      return NextResponse.json(
        { error: 'Internal server authentication error' },
        { status: 500 }
      );
    }
  };
}
