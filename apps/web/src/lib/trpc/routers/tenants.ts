import { router, protectedProcedure } from '../server';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const tenantsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        tenantName: z.string().min(2, 'Organization name must be at least 2 characters'),
        tenantSlug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a membership
      const existingMembership = await ctx.prisma.membership.findFirst({
        where: { userId: ctx.userId! },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already belongs to a tenant',
        });
      }

      // Check if slug is already taken
      const existingTenant = await ctx.prisma.tenant.findUnique({
        where: { slug: input.tenantSlug },
      });

      if (existingTenant) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slug already taken',
        });
      }

      // Create tenant and membership in a transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Get or create user record
        let dbUser = await tx.user.findUnique({
          where: { id: ctx.userId! },
        });

        if (!dbUser) {
          // For new users, we need to get their email from somewhere
          // Since we don't have it in context, we'll use a default
          dbUser = await tx.user.create({
            data: {
              id: ctx.userId!,
              email: 'user@example.com', // Will be updated by auth sync
              name: 'User',
            },
          });
        }

        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name: input.tenantName,
            slug: input.tenantSlug,
          },
        });

        // Create membership with SUPER_ADMIN role
        const membership = await tx.membership.create({
          data: {
            tenantId: tenant.id,
            userId: ctx.userId!,
            role: 'SUPER_ADMIN',
          },
        });

        return { tenant, membership };
      });

      return result;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tenant.findMany({
      where: {
        id: ctx.tenantId!,
      },
    });
  }),
});