import crypto from 'crypto';

/**
 * Recursively sorts the keys of an object to ensure consistent canonicalization.
 */
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key: string) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

/**
 * Canonicalizes a payload to a deterministic string for signing.
 */
function canonicalize(payload: object | string): string {
  return typeof payload === 'string' ? payload : JSON.stringify(sortKeys(payload));
}

/**
 * Signs a payload using the provided RSA private key (PEM format).
 * Returns a Base64-encoded signature.
 */
export function signPayload(payload: object | string, privateKeyPem: string): string {
  const canonical = canonicalize(payload);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical);
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

/**
 * Verifies a payload's signature using a base64-encoded public key.
 * Decodes the public key once and checks the signature.
 */
export function verifySignature(
  payload: object | string,
  signature: string,
  publicKeyBase64: string
): boolean {
  try {
    const canonical = canonicalize(payload);

    // Decode base64 once to get PEM
    const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf8');

    // Create KeyObject for verification
    const keyObject = crypto.createPublicKey(publicKeyPem);

    // Clean the signature (remove whitespace/newlines)
    const cleanSignature = signature.replace(/\s/g, '');

    // Perform verification
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(canonical);
    verifier.end();
    return verifier.verify(keyObject, cleanSignature, 'base64');
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Verifies a payload's signature using the SYSTEM_PUBLIC_KEY_B64 from environment.
 */
export function verifyLocalSignature(payload: object, signature: string): boolean {
  const canonical = canonicalize(payload);
  const publicKeyPem = Buffer.from(process.env.SYSTEM_PUBLIC_KEY_B64!, 'base64').toString('utf8');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical);
  verifier.end();
  return verifier.verify(publicKeyPem, signature, 'base64');
}
