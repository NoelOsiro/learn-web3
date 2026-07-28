import { router, protectedProcedure, adminProcedure } from '../server';
import { z } from 'zod';
import {
  createCreditApplication,
  listCreditFacilities,
  approveCredit,
  disburseCredit,
  recordRepayment,
} from '@cashflow/credit';

export const loanRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional(),
        status: z.string().trim().optional(),
        centerId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return listCreditFacilities(ctx.user.tenantId, input);
    }),

  create: adminProcedure
    .input(
      z.object({
        farmerId: z.string().uuid(),
        providerId: z.string().uuid().optional(),
        collectionId: z.string().uuid().optional(),
        valuationId: z.string().uuid().optional(),
        amount: z.string().refine((val) => parseFloat(val) > 0),
        interestRate: z.string(),
        termMonths: z.coerce.number().int().positive().max(120),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        purpose: z.string().trim().max(500).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createCreditApplication({
        ...input,
        tenantId: ctx.user.tenantId,
      });
    }),

  approve: adminProcedure
    .input(z.object({ creditId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return approveCredit(ctx.user.tenantId, input.creditId);
    }),

  disburse: adminProcedure
    .input(z.object({ 
      creditId: z.string().uuid(),
      sourceWalletId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return disburseCredit(ctx.user.tenantId, input.creditId, input.sourceWalletId);
    }),

  recordRepayment: protectedProcedure
    .input(
      z.object({
        creditId: z.string().uuid(),
        amount: z.string().refine((val) => parseFloat(val) > 0),
        method: z.string(),
        reference: z.string().trim().optional(),
        notes: z.string().trim().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return recordRepayment(ctx.user.tenantId, input.creditId, input);
    }),
});