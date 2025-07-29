// @/lib/pkce.ts
import { randomBytes, createHash } from 'crypto';

const base64URLEncode = (str: Buffer): string => {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export const generateCodeVerifier = (): string => {
  return base64URLEncode(randomBytes(32));
};

export const generateCodeChallenge = (verifier: string): string => {
  const hash = createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
};
