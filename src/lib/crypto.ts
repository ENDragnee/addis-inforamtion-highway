import crypto from 'crypto';

/**
 * A robust function for creating a consistent, sorted string from an object.
 * This ensures that the same object will always produce the same string for signing.
 */
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

/**
 * Signs a payload using the provided RSA private key.
 * @param payload The object or string to sign.
 * @param privateKeyPem The PEM-formatted RSA private key.
 * @returns A Base64-encoded signature.
 */
export function signPayload(payload: object | string, privateKeyPem: string): string {
  const canonical = typeof payload === 'string' ? payload : JSON.stringify(sortKeys(payload));
  
  // THE FIX: Use 'RSA-SHA256' to match your RSA keys.
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical);
  signer.end();

  return signer.sign(privateKeyPem, 'base64');
}

/**
 * Verifies a payload's signature using the provided RSA public key.
 * @param payload The original payload that was signed.
 * @param signature The Base64-encoded signature to verify.
 * @param publicKey The PEM-formatted RSA public key from the database.
 * @returns True if the signature is valid, false otherwise.
 */
export function verifySignature(
  payload: object | string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const canonical = typeof payload === 'string' ? payload : JSON.stringify(sortKeys(payload));
    
    // THE FIX: Use 'RSA-SHA256' for verification, matching the signing algorithm.
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(canonical);
    verifier.end();

    // The publicKey is the plain PEM text from the database and is used directly.
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false; // Ensure the function returns false on any cryptographic error.
  }
}

/**
 * A utility to canonicalize a request body, typically for logging or comparison.
 */
export function canonicalizeBody(body: any): string {
  const sorted = sortKeys(body);
  return JSON.stringify(sorted);
}

// NOTE: The `verifyLocalSignature` function is not used in the main flow but is
// updated here for consistency, assuming SYSTEM_... keys are also RSA.
export function verifyLocalSignature(payload: object, signature: string) {
  const canonical = JSON.stringify(sortKeys(payload));
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical);
  verifier.end();
  const publicKeyPem = Buffer.from(process.env.SYSTEM_PUBLIC_KEY_B64!, 'base64').toString('utf8');
  return verifier.verify(publicKeyPem, signature, 'base64');
}
