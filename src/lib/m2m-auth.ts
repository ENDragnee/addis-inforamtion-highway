import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

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
function canonicalizeBody(body: any): string {
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

      // Prepare canonical payload for verification
      const body = req.body;
      const payload = canonicalizeBody(body);
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payload);
      verifier.end();

      const signature = Buffer.from(signatureHeader, 'base64');
      const pubKey = institution.publicKey;
      const valid = verifier.verify(pubKey, signature);

      if (!valid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Attach institution to request for downstream handlers
      (req as any).institution = institution;

      // Invoke the actual handler
      return await handler(req, res);
    } catch (err) {
      console.error('M2M auth error:', err);
      return res.status(500).json({ error: 'Internal authentication error' });
    }
  };
}
