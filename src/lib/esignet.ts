// @/lib/esignet.ts
import { SignJWT, importJWK } from 'jose';
import crypto from 'crypto'; // Node.js crypto for UUID

export async function createClientAssertion(): Promise<string> {
  const clientId = process.env.FAYDA_CLIENT_ID!;
  const tokenEndpoint = process.env.FAYDA_TOKEN_ENDPOINT!;
  
  // Assumes FAYDA_PRIVATE_KEY in .env is the full JSON string of the JWK
  const privateKeyJwkString = process.env.FAYDA_PRIVATE_KEY;
  
  if (!clientId || !tokenEndpoint || !privateKeyJwkString) {
    throw new Error('Missing necessary environment variables for client assertion.');
  }

  const privateKeyJwk = JSON.parse(privateKeyJwkString);
  const algorithm = 'RS256';

  // Import the JWK-formatted private key
  const privateKey = await importJWK(privateKeyJwk, algorithm);

  // The 'sub' and 'iss' should be your client_id
  const assertion = await new SignJWT({})
    .setProtectedHeader({
      alg: algorithm,
      kid: privateKeyJwk.kid, // Including the Key ID is best practice
      typ: 'JWT',
    })
    .setSubject(clientId)
    .setIssuer(clientId)
    .setAudience(tokenEndpoint)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setJti(crypto.randomUUID()) // Unique identifier for the JWT
    .sign(privateKey);

  return assertion;
}
