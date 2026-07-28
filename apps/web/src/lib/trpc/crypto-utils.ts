// lib/crypto-utils.ts
import crypto from 'crypto';

/**
 * Converts a Base64-encoded SPKI public key to PEM format.
 * Handles both raw Base64 and already-PEM-formatted keys.
 */
function normalizePublicKeyToPem(publicKey: string): string {
  const trimmed = publicKey.trim();
  
  // Already in PEM format
  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }
  
  // Base64-encoded SPKI - convert to PEM
  const base64Key = trimmed.replace(/[^A-Za-z0-9+/=]/g, '');
  const keyBytes = Buffer.from(base64Key, 'base64');
  
  return `-----BEGIN PUBLIC KEY-----\n${keyBytes.toString('base64').match(/.{1,64}/g)?.join('\n') || ''}\n-----END PUBLIC KEY-----`;
}

/**
 * Verifies an Ed25519 signature against a canonical string payload.
 *
 * @param payload - The exact pipe-separated canonical string generated on the client
 * @param signatureHex - Hex-encoded signature produced by Web Crypto API (Ed25519)
 * @param publicKeyBase64OrPem - Raw Base64 or SPKI PEM public key stored in DB
 */
export function verifyEd25519Signature(
  payload: string,
  signatureHex: string,
  publicKeyBase64OrPem: string
): boolean {
  try {
    const payloadBytes = Buffer.from(payload, 'utf-8');
    const signatureBytes = Buffer.from(signatureHex, 'hex');
    const publicKeyPem = normalizePublicKeyToPem(publicKeyBase64OrPem);

    // For Ed25519, the first argument (algorithm) MUST be null
    return crypto.verify(
      null,
      payloadBytes,
      publicKeyPem,
      signatureBytes
    );
  } catch (error) {
    // Catch malformed keys/signatures gracefully
    return false;
  }
}

/**
 * Server-side derivation of fingerprint: SHA-256(publicKey)
 * Never trust client-supplied fingerprints.
 */
export function deriveFingerprint(publicKey: string): string {
  return crypto
    .createHash('sha256')
    .update(publicKey.trim())
    .digest('hex');
}