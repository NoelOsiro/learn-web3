import { CollectionStatus, Prisma, prisma, CommodityGrade, CommodityType, MeasurementUnit } from '@cashflow/database';
import { decimalSchema, paginationSchema, uuidSchema } from '@cashflow/shared';
import { z } from 'zod';
import crypto from 'crypto';

// ── Crypto Utilities ───────────────────────────────────────────────────────

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
 */
function verifyEd25519Signature(
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
    return false;
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const LAST_SEEN_THROTTLE_MS = 60_000; // Update last_seen_at at most once per minute
const PAIRING_CODE_LENGTH = 8; // alphanumeric chars in the SMS code
const PAIRING_EXPIRY_HOURS = 24; // pairing code lifespan
const PAIRING_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Characters excluded from pairing codes to avoid visual ambiguity:0/O, 1/I/l are all removed.

// ── Crypto Helpers ───────────────────────────────────────────────────────────

function generatePairingCode(): string {
  return Array.from(
    { length: PAIRING_CODE_LENGTH },
    () => PAIRING_ALPHABET[crypto.randomInt(PAIRING_ALPHABET.length)]
  ).join('');
}

function hashPairingCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

function deriveFingerprint(publicKey: string): string {
  return crypto
    .createHash('sha256')
    .update(publicKey.trim())
    .digest('hex');
}

export const createCollectionSchema = z.object({
  tenantId: uuidSchema, farmerId: uuidSchema, centerId: uuidSchema.optional(), agentId: uuidSchema.optional(), priceBookId: uuidSchema.optional(),
  commodity: z.custom<CommodityType>(), grade: z.custom<CommodityGrade>(), unit: z.custom<MeasurementUnit>(),
  quantity: decimalSchema, pricePerUnit: decimalSchema, currency: z.string().length(3).default('KES'), date: z.coerce.date(),
  deductions: decimalSchema.default('0'), photoUrl: z.string().url().optional(), gpsLocation: z.string().max(120).optional(), notes: z.string().max(1000).optional(),
});
export type CreateCollectionInput = z.input<typeof createCollectionSchema>;

export async function createCollection(input: CreateCollectionInput) {
  const data = createCollectionSchema.parse(input);
  const farmer = await prisma.farmer.findFirst({ where: { id: data.farmerId, tenantId: data.tenantId, deletedAt: null, isActive: true } });
  if (!farmer) throw new Error('Active farmer not found in this tenant');
  const grossAmount = new Prisma.Decimal(data.quantity).mul(data.pricePerUnit);
  const netAmount = grossAmount.minus(data.deductions);
  if (netAmount.isNegative()) throw new Error('Deductions cannot exceed gross amount');
  return prisma.collection.create({ data: { ...data, grossAmount: grossAmount.toFixed(4), netAmount: netAmount.toFixed(4) } });
}

export async function getCollection(tenantId: string, collectionId: string) {
  return prisma.collection.findFirst({ where: { id: collectionId, tenantId, deletedAt: null }, include: { farmer: true, valuations: { where: { deletedAt: null }, orderBy: { calculatedAt: 'desc' } } } });
}

export async function listCollections(
  tenantId: string,
  input: {
    search?: string;
    page?: number;
    limit?: number;
    status?: CollectionStatus;
    farmerId?: string;
    agentId?: string;
    viewerEmail?: string;
    viewerPhone?: string
  } = {}) {
  const { page, limit } = paginationSchema.parse(input);
  const viewerOr: Prisma.FarmerWhereInput[] = [];
  const search = input.search?.trim();
  if (input.viewerEmail) viewerOr.push({ email: input.viewerEmail });
  if (input.viewerPhone) viewerOr.push({ phoneE164: input.viewerPhone });
  const visibility: Prisma.CollectionWhereInput = input.agentId ? { agentId: input.agentId } : viewerOr.length ? { farmer: { OR: viewerOr } } : {};
  const where: Prisma.CollectionWhereInput = { tenantId, deletedAt: null, ...visibility, ...(input.status ? { status: input.status } : {}), ...(input.farmerId ? { farmerId: input.farmerId } : {}), ...(search ? { OR: [{ notes: { contains: search, mode: 'insensitive' } }] } : {}) };
  const [data, total] = await prisma.$transaction([prisma.collection.findMany({ where, include: { farmer: true, center: true, agent: true }, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.collection.count({ where })]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function cancelCollection(tenantId: string, collectionId: string) {
  const collection = await getCollection(tenantId, collectionId);
  if (!collection) throw new Error('Collection not found');
  if (collection.status === CollectionStatus.PAID) throw new Error('Paid collections cannot be cancelled');
  return prisma.collection.update({ where: { id: collection.id }, data: { status: CollectionStatus.CANCELLED } });
}

export async function listDevices(
  tenantId: string,
  input: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    centerId?: string;
    userId?: string;
    active?: boolean;
  } = {}
) {
  const { page, limit } = paginationSchema.parse(input);
  const search = input.search?.trim();
  const status = input.status?.toUpperCase();

  // Handle derived status mapping
  let statusWhere: Prisma.DevicesWhereInput = {};
  if (status === 'SUSPENDED') {
    statusWhere = { is_active: false };
  } else if (status === 'PENDING') {
    statusWhere = { is_active: true };
  } else if (status === 'VERIFIED') {
    statusWhere = { is_active: true };
  }

  const where: Prisma.DevicesWhereInput = {
    tenant_id: tenantId,
    ...statusWhere,
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {}),
    ...(input.centerId ? { centerId: input.centerId } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.active !== undefined ? { isActive: input.active } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.devices.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        center_id: true,
        user_id: true,
        is_active: true,
        bound_at: true,
        last_seen_at: true,
        pairing_expires_at: true,
        created_at: true,
        // Never expose public_key or pairing_code_hash to the client
        CollectionCenter: {
          select: { name: true, code: true },
        },
      },
    }),
    prisma.devices.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function reactivateDevice(tenantId: string, deviceId: string) {
  return prisma.devices.update({
    where: { id: deviceId, tenant_id: tenantId },
    data: { is_active: true },
  });
}

export async function deactivateDevice(tenantId: string, deviceId: string) {
  return prisma.devices.update({
    where: { id: deviceId, tenant_id: tenantId },
    data: { is_active: false },
  });
}

export async function getDevice(tenantId: string, deviceId: string) {
  return prisma.devices.findUnique({
    where: { id: deviceId, tenant_id: tenantId },
  });
}

export async function issueDevice(
  tenantId: string,
  userId: string,
  input: {
    name: string;
    centerId?: string;
    agentId?: string;
  }
) {
  const rawCode = generatePairingCode();
  const codeHash = hashPairingCode(rawCode);
  const expiresAt = new Date(Date.now() + PAIRING_EXPIRY_HOURS * 3_600_000);

  const device = await prisma.devices.upsert({
    where: {
      device_fingerprint: `pending:${tenantId}:${input.name}`,
    },
    create: {
      name: input.name,
      tenant_id: tenantId,
      center_id: input.centerId ?? null,
      user_id: input.agentId ?? null,
      device_fingerprint: `pending:${tenantId}:${input.name}`,
      public_key: '',
      pairing_code_hash: codeHash,
      pairing_expires_at: expiresAt,
      bound_by: userId,
      is_active: false,
    },
    update: {
      pairing_code_hash: codeHash,
      pairing_expires_at: expiresAt,
      bound_by: userId,
      bound_at: null,
      public_key: '',
      is_active: false,
      center_id: input.centerId ?? undefined,
      user_id: input.agentId ?? undefined,
    },
    select: {
      id: true,
      name: true,
      center_id: true,
      user_id: true,
      pairing_expires_at: true,
      is_active: true,
    },
  });

  return {
    device,
    pairingCode: rawCode,
    expiresAt,
    message: `Dispatch pairing code to agent via SMS. Code expires in ${PAIRING_EXPIRY_HOURS}h.`,
  };
}

export async function bindDevice(
  tenantId: string,
  userId: string,
  input: {
    pairingCode: string;
    publicKey: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
  }
) {
  const codeHash = hashPairingCode(input.pairingCode);
  const now = new Date();

  // Validate public key format before any DB operations
  if (!input.publicKey || input.publicKey.length < 32) {
    throw new Error('Invalid public key format');
  }

  // Find the pending device by code hash within this tenant
  const device = await prisma.devices.findFirst({
    where: {
      tenant_id: tenantId,
      pairing_code_hash: codeHash,
    },
  });

  if (!device) {
    throw new Error('Invalid pairing code');
  }

  if (!device.pairing_expires_at || device.pairing_expires_at < now) {
    throw new Error('Invalid pairing code');
  }

  // Re-use prevention: check if device already bound
  if (device.is_active && device.bound_at && device.public_key) {
    throw new Error('Device already bound. Use a new pairing code.');
  }

  // Server-side fingerprint derivation from public key
  const fingerprint = deriveFingerprint(input.publicKey);

  // Activate the device
  const bound = await prisma.devices.update({
    where: { id: device.id },
    data: {
      device_fingerprint: fingerprint,
      public_key: input.publicKey,
      user_id: userId,
      is_active: true,
      bound_at: now,
      last_seen_at: now,
      // Clear pairing fields — code is consumed
      pairing_code_hash: null,
      pairing_expires_at: null,
      // Optionally update name to reflect actual device
      ...(input.deviceName ? { name: input.deviceName } : {}),
    },
    select: {
      id: true,
      name: true,
      center_id: true,
      is_active: true,
      bound_at: true,
      user_id: true,
    },
  });

  return {
    device: bound,
    message: 'Device bound successfully. Sign every collection payload with X-Payload-Sig.',
  };
}

export async function verifyDevice(
  tenantId: string,
  deviceId: string,
  signatureHex: string,
  sequenceNumber: number,
  canonicalPayload: string
) {
  const device = await prisma.devices.findUnique({
    where: { id: deviceId, tenant_id: tenantId },
  });

  if (!device) {
    throw new Error('Device not found or inactive');
  }

  // Replay prevention check via strictly incrementing sequence number
  if (BigInt(sequenceNumber) <= device.last_sequence_number!) {
    throw new Error('Replay attack detected: sequence number must strictly increase');
  }

  // Verify Ed25519 signature
  const isValid = verifyEd25519Signature(
    canonicalPayload,
    signatureHex,
    device.public_key
  );

  if (!isValid) {
    throw new Error('Invalid payload signature for device key');
  }

  // Update lastSequenceNumber with throttled last_seen_at
  const lastSeen = device.last_seen_at?.getTime() ?? 0;
  const shouldUpdatePresence = Date.now() - lastSeen > LAST_SEEN_THROTTLE_MS;
  
  await prisma.devices.update({
    where: { id: device.id },
    data: {
      last_sequence_number: BigInt(sequenceNumber),
      ...(shouldUpdatePresence ? { last_seen_at: new Date() } : {}),
    },
  });

  return {
    verified: true,
    deviceId: device.id,
    centerId: device.center_id,
    userId: device.user_id,
    deviceName: device.name,
  };
}