import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import prisma from '@/lib/prisma';
import { verifySignature } from './crypto';

// Helper: recursively sort object keys
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = sortKeys(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

// Canonicalize JSON: minified with sorted keys
export function canonicalizeBody(body: any): string {
  const sorted = sortKeys(body);
  return JSON.stringify(sorted);
}

// Middleware wrapper to enforce m2m authentication
export function withM2MAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const clientId = req.headers['client-id'] as string;
      const signatureHeader = req.headers['signature'] as string;

      if (!clientId || !signatureHeader) {
        return res.status(401).json({ error: 'Missing Client-Id or Signature header' });
      }

      // Lookup institution by clientId
      const institution = await prisma.institution.findUnique({
        where: { clientId }
      });

      if (!institution) {
        return res.status(401).json({ error: 'Invalid Client-Id' });
      }

      const valid = verifySignature(
        institution.clientId,
        signatureHeader,
        institution.publicKey
      );

      if (!valid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      (req as any).institution = institution;

      // Invoke the actual handler
      return await handler(req, res);
    } catch (err) {
      console.error('M2M auth error:', err);
      return res.status(500).json({ error: 'Internal authentication error' });
    }
  };
}
