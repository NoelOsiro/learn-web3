'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3, Building2, LayoutDashboard, Leaf, Landmark, Menu, Moon,
  Package, Settings, Sun, UserCog, Users, Wallet, X, BadgeDollarSign,
  Smartphone,
} from 'lucide-react';
import type { UserRole } from '@cashflow/database';
import { MENU_PERMISSIONS } from '@/lib/permissions/permissions';

export interface DashboardUser {
  name: string;
  email: string;
  role: UserRole;
  tenant: { name: string };
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Farmers', href: '/dashboard/farmers', icon: Users },
  { name: 'Collections', href: '/dashboard/collections', icon: Package },
  { name: 'Valuations', href: '/dashboard/valuations', icon: BadgeDollarSign },
  { name: 'Price Books', href: '/dashboard/loans/price-books', icon: Leaf },
  { name: 'Devices', href: '/dashboard/devices', icon: Smartphone },
  { name: 'Loans', href: '/dashboard/loans', icon: Landmark },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Users', href: '/dashboard/users', icon: UserCog },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardShell({ user, children }: { user: DashboardUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDark = localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark); document.documentElement.classList.toggle('dark', isDark);
  }, []);
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.theme = next ? 'dark' : 'light'; document.documentElement.classList.toggle('dark', next); };
  const allowed = navigation.filter((item) => !MENU_PERMISSIONS[item.href] || MENU_PERMISSIONS[item.href].includes(user.role));

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 h-16 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Leaf className="h-5 w-5" /></span>
            <span className="font-bold tracking-tight">Cashflow<span className="text-primary">.ag</span></span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex"><Building2 className="h-3.5 w-3.5 text-primary" />{user.tenant.name}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleTheme} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle color theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold leading-none">{user.name}</p><p className="mt-1 text-xs text-muted-foreground">{user.role.replaceAll('_', ' ')}</p></div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{user.name.slice(0, 1).toUpperCase()}</span>
          <form action="/auth/logout" method="POST"><button className="hidden rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted md:block">Sign out</button></form>
        </div>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1600px]">
      <aside className="hidden w-64 shrink-0 border-r border-border/80 px-3 py-5 lg:block"><Nav items={allowed} pathname={pathname} /></aside>
      {menuOpen && <><button onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-foreground/25 lg:hidden" aria-label="Close navigation" /><aside className="fixed inset-y-0 left-0 z-50 w-72 bg-card p-4 shadow-2xl lg:hidden"><div className="mb-5 flex justify-end"><button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><Nav items={allowed} pathname={pathname} onNavigate={() => setMenuOpen(false)} /></aside></>}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  </div>;
}

function Nav({ items, pathname, onNavigate }: { items: typeof navigation; pathname: string; onNavigate?: () => void }) {
  return <nav className="space-y-1"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>{items.map(({ name, href, icon: Icon }) => {
    const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
    return <Link key={href} href={href} onClick={onNavigate} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className={`h-4 w-4 ${active ? '' : 'group-hover:text-primary'}`} />{name}</Link>;
  })}</nav>;
}
