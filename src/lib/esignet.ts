import { SignJWT, importPKCS8 } from 'jose';
import { TextEncoder } from 'util';

export async function createClientAssertion(): Promise<string> {
  const clientId = process.env.CLIENT_ID!;
  const tokenEndpoint = process.env.TOKEN_ENDPOINT!;
  const privateKeyPem = process.env.ESIGNET_PRIVATE_KEY!;
  const algorithm = process.env.ALGORITHM || 'RS256';
  const expirationTime = process.env.EXPIRATION_TIME || '5m';

  if (!clientId || !tokenEndpoint || !privateKeyPem) {
    throw new Error('Missing necessary environment variables for client assertion.');
  }

  // Import the PEM-formatted private key
  const privateKey = await importPKCS8(privateKeyPem, algorithm);

  // The 'sub' and 'iss' should be your client_id
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
    .setSubject(clientId)
    .setIssuer(clientId)
    .setAudience(tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setJti(crypto.randomUUID()) // Unique identifier for the JWT
    .sign(privateKey);

  return assertion;
}
