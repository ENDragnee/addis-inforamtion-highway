import crypto from 'crypto';

const privateKeyPem = Buffer.from(process.env.SYSTEM_PRIVATE_KEY_B64!, 'base64').toString('utf8');

export function signPayload(payload: object) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical);
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

export function verifyLocalSignature(payload: object, signature: string) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical);
  verifier.end();
  const publicKeyPem = Buffer.from(process.env.SYSTEM_PUBLIC_KEY_B64!, 'base64').toString('utf8');
  return verifier.verify(publicKeyPem, signature, 'base64');
}

export function verifySignature( payload: object|string, signature: string, publicKey: string) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical);
  verifier.end();
  const publicKeyPem = Buffer.from(publicKey, 'base64').toString('utf8');
  return verifier.verify(publicKeyPem, signature, 'base64');
}



