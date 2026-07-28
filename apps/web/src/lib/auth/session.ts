import { cookies } from 'next/headers';
import { createServerClientWithCookies } from '@cashflow/auth/server';
import { prisma } from '@cashflow/database';

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClientWithCookies(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentUser() {
  const user = await getSession();

  if (!user) {
    return null;
  }

  // Get user's membership and tenant
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      tenant: {
        deletedAt: null,
      },
    },
    include: {
      tenant: true,
      user: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: membership.user.name,
    phone: user.phone,
    avatarUrl: membership.user.avatarUrl,
    tenantId: membership.tenantId,
    tenant: membership.tenant,
    role: membership.role,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }

  return user;
}
