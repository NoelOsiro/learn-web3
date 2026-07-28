// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { UserRole } from '@cashflow/database';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = (await getCurrentUser()) as UserPayload | null;

  if (!user) {
    redirect('/auth/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
