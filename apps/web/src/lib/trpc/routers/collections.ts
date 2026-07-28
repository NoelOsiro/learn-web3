import { router, protectedProcedure } from '../server';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const commodityEnum = z.enum(['MILK', 'MAIZE', 'COFFEE', 'AVOCADO', 'MACADAMIA', 'TEA']);
const gradeEnum = z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'PREMIUM', 'STANDARD', 'REJECT']);
const unitEnum = z.enum(['KG', 'LITRE', 'TONNE', 'BAG', 'CRATE', 'UNIT']);

export const collectionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Tenant context required',
      });
    }
    return ctx.prisma.collection.findMany({
      where: {
        tenantId: ctx.tenantId,
        deletedAt: null,
      },
      include: {
        farmer: true,
        center: true,
        agent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  create: protectedProcedure.input(
    z.object({
      farmerId: z.string().uuid('Invalid Farmer ID'),
      centerId: z.string().uuid().optional().nullable(),
      agentId: z.string().uuid().optional().nullable(),
      priceBookId: z.string().uuid().optional().nullable(),
      commodity: commodityEnum,
      grade: gradeEnum,
      unit: unitEnum,
      quantity: z.number().positive('Quantity must be greater than zero'),
      pricePerUnit: z.number().nonnegative('Price cannot be negative'),
      currency: z.string().default('KES'),
      date: z.coerce.date().optional(),
      deductions: z.number().nonnegative('Deductions cannot be negative').default(0),
      photoUrl: z.string().url().optional().nullable(),
      gpsLocation: z.string().max(120).optional().nullable(),
      notes: z.string().max(1000).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Tenant context required',
        });
      }
      const grossAmount = input.quantity * input.pricePerUnit;
      const netAmount = grossAmount - input.deductions;
      if (netAmount < 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Deductions cannot exceed gross amount',
        });
      }

      const createData: any = {
        farmerId: input.farmerId,
        tenantId: ctx.tenantId,
        commodity: input.commodity,
        grade: input.grade,
        unit: input.unit,
        quantity: input.quantity,
        pricePerUnit: input.pricePerUnit,
        currency: input.currency,
        deductions: input.deductions,
        grossAmount,
        netAmount,
        date: input.date || new Date(),
        status: 'PENDING',
      };
      
      if (input.centerId !== null && input.centerId !== undefined) {
        createData.centerId = input.centerId;
      }
      if (input.agentId !== null && input.agentId !== undefined) {
        createData.agentId = input.agentId;
      }
      if (input.priceBookId !== null && input.priceBookId !== undefined) {
        createData.priceBookId = input.priceBookId;
      }
      if (input.photoUrl !== null && input.photoUrl !== undefined) {
        createData.photoUrl = input.photoUrl;
      }
      if (input.gpsLocation !== null && input.gpsLocation !== undefined) {
        createData.gpsLocation = input.gpsLocation;
      }
      if (input.notes !== null && input.notes !== undefined) {
        createData.notes = input.notes;
      }

      return ctx.prisma.collection.create({
        data: createData,
      });
    }),

  createBatch: protectedProcedure
    .input(
      z.array(
        z.object({
          farmerId: z.string().uuid('Invalid Farmer ID'),
          centerId: z.string().uuid().optional().nullable(),
          agentId: z.string().uuid().optional().nullable(),
          priceBookId: z.string().uuid().optional().nullable(),
          commodity: commodityEnum,
          grade: gradeEnum,
          unit: unitEnum,
          quantity: z.number().positive('Quantity must be positive'),
          pricePerUnit: z.number().nonnegative('Price cannot be negative'),
          currency: z.string().default('KES'),
          deductions: z.number().nonnegative('Deductions cannot be negative').default(0),
          notes: z.string().max(1000).optional().nullable(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Tenant context required',
        });
      }
      const results = await ctx.prisma.$transaction(
        input.map((collection) => {
          const grossAmount = collection.quantity * collection.pricePerUnit;
          const netAmount = grossAmount - collection.deductions;

          if (netAmount < 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Deductions exceed gross amount for farmer ${collection.farmerId}`,
            });
          }

          const createData: any = {
            farmerId: collection.farmerId,
            tenantId: ctx.tenantId,
            commodity: collection.commodity,
            grade: collection.grade,
            unit: collection.unit,
            quantity: collection.quantity,
            pricePerUnit: collection.pricePerUnit,
            currency: collection.currency,
            deductions: collection.deductions,
            grossAmount,
            netAmount,
            date: new Date(),
            status: 'PENDING',
          };
          
          if (collection.centerId !== null && collection.centerId !== undefined) {
            createData.centerId = collection.centerId;
          }
          if (collection.agentId !== null && collection.agentId !== undefined) {
            createData.agentId = collection.agentId;
          }
          if (collection.priceBookId !== null && collection.priceBookId !== undefined) {
            createData.priceBookId = collection.priceBookId;
          }
          if (collection.notes !== null && collection.notes !== undefined) {
            createData.notes = collection.notes;
          }

          return ctx.prisma.collection.create({
            data: createData,
          });
        })
      );

      return {
        success: true,
        created: results.length,
        collections: results,
      };
    }),

});