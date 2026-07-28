// lib/client-crypto.ts

// 1. Generate Ed25519 Keypair in Browser
export async function generateDeviceKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true, // extractable
    ['sign', 'verify']
  );

  // Export public key as SPKI (PEM or Base64 format) to send to server during bind()
  const exportedPublic = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = Buffer.from(exportedPublic).toString('base64');

  return {
    privateKey: keyPair.privateKey, // Store securely in IndexedDB
    publicKeyBase64,
  };
}

// 2. Canonical Payload Builder
export function buildCanonicalPayload(params: {
  tenantId: string;
  deviceId: string;
  collectionId: string;
  farmerId: string;
  commodity: string;
  quantity: number;
  sequenceNumber: number;
  timestampISO: string;
}): string {
  // Join with exact pipe ordering
  return [
    params.tenantId,
    params.deviceId,
    params.collectionId,
    params.farmerId,
    params.commodity,
    params.quantity.toString(),
    params.sequenceNumber.toString(),
    params.timestampISO,
  ].join('|');
}

// 3. Sign Canonical Payload
export async function signPayload(privateKey: CryptoKey, canonicalPayload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalPayload);

  const signatureBuffer = await window.crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    data
  );

  return Buffer.from(signatureBuffer).toString('hex');
}