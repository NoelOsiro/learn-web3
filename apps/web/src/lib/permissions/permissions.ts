// lib/auth/permissions.ts

import { UserRole } from "@cashflow/database";


export interface MenuItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: UserRole[];
}

// Map menu items to allowed roles
export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER', 'COLLECTION_AGENT'],
  '/dashboard/farmers': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER', 'COLLECTION_AGENT'],
  '/dashboard/collections': ['SUPER_ADMIN', 'TENANT_ADMIN', 'COLLECTION_AGENT'],
  '/dashboard/valuations': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER'],
  '/dashboard/loans': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER','COLLECTION_AGENT'],
  '/dashboard/wallets': ['SUPER_ADMIN', 'TENANT_ADMIN'],
  '/dashboard/reports': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER','COLLECTION_AGENT'],
  '/dashboard/users': ['SUPER_ADMIN', 'TENANT_ADMIN'],
  '/dashboard/settings': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER', 'COLLECTION_AGENT'],
  '/dashboard/devices': ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOAN_OFFICER', 'COLLECTION_AGENT'],
  '/agent/bind': ['COLLECTION_AGENT'],
};

export function hasPermission(userRole: UserRole, path: string): boolean {
  const allowed = MENU_PERMISSIONS[path];
  if (!allowed) return true; // Default allow if not explicitly restricted
  return allowed.includes(userRole);
}