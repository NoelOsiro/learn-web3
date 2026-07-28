import { Prisma } from '@cashflow/database';
import { router, protectedProcedure, adminProcedure } from '../server';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const valuationsRouter = router({
  getValuations: protectedProcedure
    .input(
      z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().trim().optional(),
        currency: z.string().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
        dateRange: z.enum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'CUSTOM']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 100, search, currency, dateRange, dateFrom, dateTo } = input || {};

      let calculatedAtFilter: Prisma.DateTimeFilter | undefined;
      
      if (dateRange === 'TODAY') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        calculatedAtFilter = { gte: today };
      } else if (dateRange === 'THIS_WEEK') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        calculatedAtFilter = { gte: startOfWeek };
      } else if (dateRange === 'THIS_MONTH') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        calculatedAtFilter = { gte: startOfMonth };
      } else if (dateRange === 'CUSTOM' && dateFrom && dateTo) {
        calculatedAtFilter = { gte: dateFrom, lte: dateTo };
      }

      const where: Prisma.ValuationWhereInput = {
        tenantId: ctx.user.tenantId,
        deletedAt: null,
        ...(calculatedAtFilter && { calculatedAt: calculatedAtFilter }),
        ...(currency && { currency }),
        ...(search ? {
          collection: {
            farmer: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        } : {}),
      };

      const [data, total] = await ctx.prisma.$transaction([
        ctx.prisma.valuation.findMany({
          where,
          include: {
            collection: {
              include: {
                farmer: true,
              },
            },
            credits: true,
          },
          orderBy: { calculatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.valuation.count({ where }),
      ]);

      return { 
        data, 
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.valuation.findFirst({
        where: { 
          id: input.id, 
          tenantId: ctx.user.tenantId, 
          deletedAt: null 
        },
        include: {
          collection: {
            include: {
              farmer: true,
              priceBook: {
                include: {
                  lines: true,
                },
              },
            },
          },
          credits: {
            include: {
              farmer: true,
              provider: true,
            },
          },
        },
      });
    }),

  recalculateValuation: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const valuation = await ctx.prisma.valuation.findFirst({
        where: { id: input.id, tenantId: ctx.user.tenantId, deletedAt: null },
        include: {
          collection: {
            include: {
              priceBook: {
                include: {
                  lines: true,
                },
              },
            },
          },
        },
      });

      if (!valuation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Valuation not found',
        });
      }

      const collection = valuation.collection;
      const priceBookLine = collection.priceBook?.lines.find(
        (line) => line.grade === collection.grade && line.unit === collection.unit
      );

      if (!priceBookLine) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No matching price book line found for this collection',
        });
      }

      const grossAmount = Number(collection.quantity) * Number(priceBookLine.pricePerUnit);
      
      // Parse existing deductions and recalculate
      const deductions = valuation.deductions as any[];
      let totalDeductions = 0;
      
      const recalculatedDeductions = deductions.map((deduction) => {
        let amount = deduction.amount;
        if (deduction.type === 'PERCENTAGE' && deduction.percentage) {
          amount = (grossAmount * deduction.percentage) / 100;
        }
        totalDeductions += amount;
        return { ...deduction, amount };
      });

      const netAmount = grossAmount - totalDeductions;

      return ctx.prisma.valuation.update({
        where: { id: input.id },
        data: {
          grossAmount: new Prisma.Decimal(grossAmount),
          deductions: recalculatedDeductions as any,
          netAmount: new Prisma.Decimal(netAmount),
          calculatedAt: new Date(),
        },
        include: {
          collection: {
            include: {
              farmer: true,
            },
          },
          credits: true,
        },
      });
    }),

  updateValuationNotes: adminProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const valuation = await ctx.prisma.valuation.findFirst({
        where: { id: input.id, tenantId: ctx.user.tenantId, deletedAt: null },
      });

      if (!valuation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Valuation not found',
        });
      }

      return ctx.prisma.valuation.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),

  softDelete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const valuation = await ctx.prisma.valuation.findFirst({
        where: { id: input.id, tenantId: ctx.user.tenantId, deletedAt: null },
      });

      if (!valuation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Valuation not found',
        });
      }

      return ctx.prisma.valuation.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),
});
