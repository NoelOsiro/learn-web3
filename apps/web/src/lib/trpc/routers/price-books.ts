import { router, protectedProcedure, adminProcedure } from '../server';
import { z } from 'zod';
import { CommodityType } from '@cashflow/database';
import {
  listPriceBooks,
  getActivePriceBooks,
  getPriceBookById,
  createPriceBook,
  updatePriceBook,
  setDefaultPriceBook,
  deletePriceBook,
} from '@cashflow/credit';

export const priceBooksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional(),
        commodity: z.nativeEnum(CommodityType).optional().nullable(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return listPriceBooks(ctx.user.tenantId, {
        ...input,
        commodity: input?.commodity || undefined,
      });
    }),

  active: protectedProcedure.query(async ({ ctx }) => {
    return getActivePriceBooks(ctx.user.tenantId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getPriceBookById(ctx.user.tenantId, input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        commodity: z.nativeEnum(CommodityType),
        isDefault: z.boolean().optional(),
        validFrom: z.coerce.date(),
        validTo: z.coerce.date().optional(),
        lines: z.array(
          z.object({
            grade: z.string(),
            unit: z.string(),
            pricePerUnit: z.string().refine((val) => parseFloat(val) > 0),
            currency: z.string().default('KES'),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createPriceBook({
        ...input,
        tenantId: ctx.user.tenantId,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(200).optional(),
        commodity: z.nativeEnum(CommodityType).optional(),
        isDefault: z.boolean().optional(),
        validFrom: z.coerce.date().optional(),
        validTo: z.coerce.date().optional(),
        lines: z.array(
          z.object({
            id: z.string().uuid().optional(),
            grade: z.string(),
            unit: z.string(),
            pricePerUnit: z.string().refine((val) => parseFloat(val) > 0),
            currency: z.string().default('KES'),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return updatePriceBook(ctx.user.tenantId, id, updateData);
    }),

  setDefault: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return setDefaultPriceBook(ctx.user.tenantId, input.id);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deletePriceBook(ctx.user.tenantId, input.id);
    }),
});