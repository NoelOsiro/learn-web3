// lib/crypto/webcrypto.ts
// WebCrypto utility for Ed25519 key generation and IndexedDB storage

const DB_NAME = 'cashflow_device_keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

interface StoredKeyPair {
  id: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
  createdAt: number;
  deviceName?: string;
}

/**
 * Open IndexedDB for secure key storage
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generate Ed25519 keypair using WebCrypto
 * Note: Ed25519 support depends on browser. Falls back to P-256 if Ed25519 not available.
 */
export async function generateEd25519KeyPair(): Promise<{
  publicKeyBase64: string;
  privateKeyBase64: string;
  algorithm: string;
}> {
  if (!crypto.subtle) {
    throw new Error('WebCrypto API not available. HTTPS is required.');
  }

  try {
    // Try Ed25519 first (modern browsers)
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = bufferToBase64(privateKeyBuffer);

    return {
      publicKeyBase64,
      privateKeyBase64,
      algorithm: 'Ed25519',
    };
  } catch (error) {
    // Fallback to ECDSA P-256 if Ed25519 not supported
    console.warn('Ed25519 not supported, falling back to P-256:', error);
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = bufferToBase64(privateKeyBuffer);

    return {
      publicKeyBase64,
      privateKeyBase64,
      algorithm: 'ECDSA-P256',
    };
  }
}

/**
 * Store keypair in IndexedDB
 */
export async function storeKeyPair(
  deviceId: string,
  publicKeyBase64: string,
  privateKeyBase64: string,
  deviceName?: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: StoredKeyPair = {
      id: deviceId,
      publicKeyBase64,
      privateKeyBase64,
      createdAt: Date.now(),
      deviceName,
    };

    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Retrieve private key from IndexedDB
 */
export async function getPrivateKey(deviceId: string): Promise<string | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(deviceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredKeyPair | undefined;
      resolve(result?.privateKeyBase64 || null);
    };
  });
}

/**
 * Retrieve full keypair from IndexedDB
 */
export async function getKeyPair(deviceId: string): Promise<StoredKeyPair | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(deviceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredKeyPair | undefined;
      resolve(result || null);
    };
  });
}

/**
 * Delete keypair from IndexedDB
 */
export async function deleteKeyPair(deviceId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(deviceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Derive SHA-256 fingerprint from public key
 */
export async function deriveFingerprint(publicKeyBase64: string): Promise<string> {
  const publicKeyBuffer = base64ToBuffer(publicKeyBase64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign data with private key
 */
export async function signData(
  data: string,
  privateKeyBase64: string,
  algorithm: string = 'Ed25519'
): Promise<string> {
  const privateKeyBuffer = base64ToBuffer(privateKeyBase64);
  const dataBuffer = new TextEncoder().encode(data);

  let privateKey: CryptoKey;
  let signature: ArrayBuffer;

  if (algorithm === 'Ed25519') {
    privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['sign']
    );
    signature = await crypto.subtle.sign('Ed25519', privateKey, dataBuffer);
  } else {
    privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      dataBuffer
    );
  }

  return bufferToBase64(signature);
}

// Utility functions
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get device info for naming
 */
export function getDeviceInfo(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Simple device detection
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/Tablet/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  return `${deviceType} (${platform})`;
}
