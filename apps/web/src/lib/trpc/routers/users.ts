import { router, protectedProcedure, adminProcedure } from '../server';

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        userId: ctx.user.id,
        tenantId: ctx.tenantId!,
      },
      include: {
        tenant: true,
        user: true,
      },
    });

    return membership;
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.membership.findMany({
      where: {
        tenantId: ctx.tenantId!,
      },
      include: {
        user: true,
      },
    });
  }),
});