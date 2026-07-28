// server/routers/devices.ts
// tRPC router for agent device binding and management.
//
// Flow summary:
//   1. Admin: issue()        → creates/updates Device row, sets pairing_code_hash + expiry
//   2. Agent: bind()         → validates pairing code, stores public_key + fingerprint
//   3. API middleware: verify() → called per-request to authenticate signed payloads
//   4. Admin: deactivate()   → revokes device access without deleting the audit row
//   5. Admin: list()         → dashboard view of all devices for the tenant
import { router, protectedProcedure, adminProcedure } from '../server';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  listDevices,
  reactivateDevice,
  getDevice,
  deactivateDevice,
  verifyDevice,
  issueDevice,
  bindDevice,
} from '@cashflow/collections';


// ── Router ───────────────────────────────────────────────────────────────────

export const devicesRouter = router({

  // ── 1. issue() — admin pre-registers a device and gets a pairing code ────
  //
  // Creates a Device row (or re-issues a pairing code for an existing device).
  // Returns the raw pairing code ONCE — it is never stored, only its hash is.
  // Caller is responsible for dispatching it to the agent via SMS.
  //
  // Idempotent on (tenant_id, name): calling again for the same device name
  // resets the pairing code and expiry, which is the correct behaviour when
  // an agent misses their 24h window.
  issue: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        centerId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return issueDevice(ctx.user.tenantId, ctx.user.id, input);
    }),

  // ── 2. bind() — agent completes device registration ──────────────────────
  //
  // Called from the agent's browser on first login after OTP verification.
  // Validates the pairing code, stores the public key and real fingerprint,
  // marks the device as active.
  //
  // Security properties:
  //   - Pairing code compared as hash — raw code never hits the server in cleartext
  //     (caller hashes it client-side before sending... or we hash it here; see note)
  //   - Single-use: pairing_code_hash + pairing_expires_at are cleared on success
  //   - device_fingerprint (SHA-256 of public key) uniquely identifies the device
  //   - If the same agent re-binds (new device), old binding is superseded
  bind: protectedProcedure
    .input(
      z.object({
        pairingCode: z.string().length(8),
        publicKey: z.string().min(32),
        deviceName: z.string().min(1).max(200).optional(),
        platform: z.string().optional(),
        appVersion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return bindDevice(ctx.user.tenantId, ctx.user.id, input);
    }),

  // ── 3. verify() — authenticate an incoming signed payload ────────────────
  //
  // Called by API middleware on every agent collection submission.
  // NOT a user-facing mutation — this is an internal procedure called
  // server-side from the collections intake handler or middleware.
  //
  // Returns the verified device record on success so the caller can attach
  // device_id to the collection record without a second DB round-trip.
  verify: protectedProcedure
    .input(
      z.object({
        deviceId:           z.string().uuid(),
        signatureHex:      z.string(),
        sequenceNumber:    z.number().int().positive(),
        // Canonical payload bytes as hex string — the thing that was signed.
        // Caller serialises Buffer → hex before sending to tRPC.
        canonicalPayload:  z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return verifyDevice(
        ctx.user.tenantId,
        input.deviceId,
        input.signatureHex,
        input.sequenceNumber,
        input.canonicalPayload
      );
    }),

  // ── 4. deactivate() — admin revokes device access ────────────────────────
  // Sets is_active = false. The device row is preserved for audit trail.
  deactivate: adminProcedure
    .input(z.object({ deviceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {

      const device = await getDevice(ctx.user.tenantId, input.deviceId);

      if (!device) {
        throw new TRPCError({
          code:    'NOT_FOUND',
          message: 'Device not found in this tenant',
        });
      }

      if (!device.is_active) {
        throw new TRPCError({
          code:    'CONFLICT',
          message: 'Device is already inactive',
        });
      }

      await deactivateDevice(ctx.user.tenantId, device.id);

      return { success: true, deviceId: device.id };
    }),

  // ── 5. reactivate() — admin restores a deactivated device ────────────────
  //
  // Only valid if the device was previously bound (has a real fingerprint
  // and public key). Does NOT re-issue a pairing code — the binding already
  // exists. For a genuinely new device, use issue() instead.
  reactivate: adminProcedure
    .input(z.object({ deviceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const device = await getDevice(ctx.user.tenantId, input.deviceId);
      if (!device) {
        throw new TRPCError({
          code:    'NOT_FOUND',
          message: 'Device not found in this tenant',
        });
      }
      // Must have been previously bound — no public key means it was never
      // completed and reactivating would be pointless (verify() would fail anyway)
      if (!device.public_key || device.device_fingerprint.startsWith('pending:')) {
        throw new TRPCError({
          code:    'BAD_REQUEST',
          message: 'Device has never been bound. Issue a new pairing code instead.',
        });
      }
      if (device.is_active) {
        throw new TRPCError({
          code:    'CONFLICT',
          message: 'Device is already active',
        });
      }
      await reactivateDevice(ctx.user.tenantId, device.id);
      return { success: true, deviceId: device.id };
    }),

  // ── 6. list() — admin view of all devices for the tenant ─────────────────
  //
  // Returns all devices including inactive ones so admins can see the full
  // binding history. Status filtering is client-side on this small dataset.
  list: adminProcedure
    .input(
      z.object({
        centerId: z.string().uuid().optional(),
        userId:   z.string().uuid().optional(),
        active:   z.boolean().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { data: devices } = await listDevices(ctx.tenantId!, input);
      const withStatus = devices.map((d) => ({
        ...d,
        bindingStatus: deriveBindingStatus(d),
      }));

      return { devices: withStatus, total: withStatus.length };
    }),

  // ── 7. myDevice() — agent checks their own binding status ────────────────
  //
  // Called from the agent app on login to determine whether device binding
  // is complete or if the pairing flow needs to run.
  myDevice: protectedProcedure.query(async ({ ctx }) => {
    const device = await ctx.prisma.devices.findFirst({
      where: {
        tenant_id: ctx.user.tenantId,
        user_id:   ctx.user.id,
        is_active: true,
      },
      select: {
        id:           true,
        name:         true,
        center_id:    true,
        is_active:    true,
        bound_at:     true,
        last_seen_at: true,
        CollectionCenter: {
          select: { name: true, code: true, county: true },
        },
      },
    });

    return {
      bound:  !!device,
      device: device ?? null,
    };
  }),
});

// ── Derive binding status ─────────────────────────────────────────────────────
// Single status string for UI display, derived from DB fields.

type DeviceRow = {
  is_active:          boolean;
  bound_at:           Date | null;
  pairing_expires_at: Date | null;
  device_fingerprint?: string;
};

function deriveBindingStatus(
  d: DeviceRow
): 'bound' | 'pending' | 'expired' | 'inactive' {
  if (!d.is_active && d.bound_at) return 'inactive';
  if (d.bound_at)                  return 'bound';
  if (
    d.pairing_expires_at &&
    d.pairing_expires_at > new Date()
  )                                return 'pending';
  return 'expired';
}

export type DevicesRouter = typeof devicesRouter;