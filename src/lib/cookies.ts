import { SignJWT, jwtVerify } from 'jose';

// This secret MUST be at least 32 characters long for the HS256 algorithm.
const secretKey = process.env.SESSION_PASSWORD!;
const key = new TextEncoder().encode(secretKey);

/**
 * Encrypts a payload into a JWT string.
 */
export async function encrypt(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // A short expiry for temporary data like code_verifier
    .sign(key);
}

/**
 * Decrypts a JWT string and returns its payload.
 * Returns null if the token is invalid or expired.
 */
export async function decrypt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the cookie is expired or has been tampered with.
    console.error('Cookie decryption failed:', error);
    return null;
  }
}
