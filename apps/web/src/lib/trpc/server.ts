// server.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { createServerClientWithCookies } from '@cashflow/auth/server';
import { cookies } from 'next/headers';
import { prisma } from '@cashflow/database';

export const createContext = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClientWithCookies(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId: string | null = null;
  let tenantId: string | null = null;
  let userRole: string | null = null;

  if (user) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        tenant: {
          deletedAt: null,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (membership) {
      userId = user.id;
      tenantId = membership.tenantId;
      userRole = membership.role;
    }
  }

  return {
    userId,
    tenantId,
    userRole,
    prisma,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure adds structured `user` object to ctx
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.tenantId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in with an active tenant',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Structured user object matches router expectations
      user: {
        id: ctx.userId,
        tenantId: ctx.tenantId,
        role: ctx.userRole ?? 'USER',
      },
      prisma: ctx.prisma,
    },
  });
});

// Admin procedure simplifies role checking in procedures
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const ADMIN_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN'];
  if (!ADMIN_ROLES.includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next();
});