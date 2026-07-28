import { router, protectedProcedure } from '../server';
import { z } from 'zod';
import {
  createFarmer,
  getFarmer,
  listFarmers,
  updateFarmer,
  archiveFarmer,
  restoreFarmer,
  getDashboardStats,
} from '@cashflow/farmers';

export const farmersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return listFarmers(ctx.tenantId!, input);
    }),

  get: protectedProcedure
    .input(z.object({ farmerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getFarmer(ctx.tenantId!, input.farmerId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        phoneE164: z.string(),
        email: z.string().optional(),
        address: z.string().optional(),
        location: z.string().optional(),
        gpsCoordinates: z.string().optional(),
        idNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createFarmer({ ...input, tenantId: ctx.tenantId! });
    }),

  update: protectedProcedure
    .input(
      z.object({
        farmerId: z.string(),
        name: z.string().optional(),
        phoneE164: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        location: z.string().optional(),
        gpsCoordinates: z.string().optional(),
        idNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { farmerId, ...data } = input;
      return updateFarmer(ctx.tenantId!, farmerId, data);
    }),

  archive: protectedProcedure
    .input(z.object({ farmerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return archiveFarmer(ctx.tenantId!, input.farmerId);
    }),

  restore: protectedProcedure
    .input(z.object({ farmerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return restoreFarmer(ctx.tenantId!, input.farmerId);
    }),

  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardStats(ctx.tenantId!);
  }),
});