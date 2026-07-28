import { getCurrentUser } from '@/lib/auth/session';
import { listCollections } from '@cashflow/collections';
import Link from 'next/link';
import { ArrowRight, Landmark, Leaf, Package, Users, Wallet } from 'lucide-react';
import { PageHeader, KPI } from '@cashflow/ui';
import { getDashboardStats } from '@cashflow/farmers';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Get dashboard stats
  const { farmerCount, collectionCount, activeCreditCount, totalWalletBalance } = await getDashboardStats(user.tenantId);

  const stats = [
    {
      name: 'Total Farmers',
      value: farmerCount,
      icon: <Users className="h-4 w-4" />,
      href: '/dashboard/farmers',
    },
    {
      name: 'Collections',
      value: collectionCount,
      icon: <Package className="h-4 w-4" />,
      href: '/dashboard/collections',
    },
    {
      name: 'Active Loans',
      value: activeCreditCount,
      icon: <Landmark className="h-4 w-4" />,
      href: '/dashboard/loans',
    },
    {
      name: 'Wallet Balance',
      value: `KES ${totalWalletBalance._sum.cachedBalance?.toLocaleString() || '0'}`,
      icon: <Wallet className="h-4 w-4" />,
      href: '/dashboard/wallets',
    },
  ];

  const kpis = stats.map((stat, index) => ({ label: stat.name, value: String(stat.value), sub: ['Registered cooperative members', 'Produce batches recorded', 'Credit facilities in repayment', 'Available across farmer wallets'][index], icon: stat.icon, accent: ['#16a34a', '#0ea5e9', '#f59e0b', '#7c3aed'][index] }));
  const { data: recentCollections } = await listCollections(user.tenantId, { limit: 5 });

  return <div className="mx-auto max-w-screen-2xl space-y-8">
    <PageHeader subtitle="Operations overview" title={`Good day, ${user.name.split(' ')[0]}`} description="A live view of your cooperative’s field activity, finance, and payout readiness." />
    <KPI kpis={kpis} />
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Recent produce intake</h2><p className="mt-1 text-xs text-muted-foreground">Latest batches submitted by field agents</p></div><Link href="/dashboard/collections" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View ledger <ArrowRight className="h-4 w-4" /></Link></div><div className="space-y-2">{recentCollections.length ? recentCollections.map((collection) => <div key={collection.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Leaf className="h-4 w-4" /></span><div><p className="text-sm font-semibold">{collection.farmer.name}</p><p className="text-xs text-muted-foreground">{collection.commodity} · {collection.quantity.toString()} {collection.unit}</p></div></div><p className="text-sm font-bold text-primary">KES {collection.netAmount.toNumber().toLocaleString()}</p></div>) : <p className="py-10 text-center text-sm text-muted-foreground">No collection activity yet.</p>}</div></section>
      <section className="rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-glow"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground/70">Today’s focus</p><h2 className="mt-3 text-xl font-bold">Keep payments moving at the pace of harvest.</h2><p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">Review pending batches, confirm quality checks, and release farmer payouts from one operational workspace.</p><div className="mt-6 space-y-2"><Link href="/dashboard/collections" className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/20">Review collections <ArrowRight className="h-4 w-4" /></Link><Link href="/dashboard/wallets" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15">Open wallets <ArrowRight className="h-4 w-4" /></Link></div></section>
    </div>
  </div>;
}
