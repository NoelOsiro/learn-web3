import {
  RefreshCw,
  Send,
  DollarSign,
  Clock,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { listWallets } from '@cashflow/wallets';
import { getCurrentUser } from '@/lib/auth/session';
import { PageHeader, KPI } from '@cashflow/ui';
import WalletsDataTable, { WalletAccount } from '@/components/tables/walletsTable';
import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';


interface PageProps {
  searchParams: Promise<{
    q?: string;
    channel?: string;
    status?: string;
  }>;
}

export default async function WalletsPage({ searchParams }: PageProps) {
  const { q, channel, status } = await searchParams;

  const user = await getCurrentUser();
  if (!user) return null;

  // Pass all active filters directly to the backend list query
  const {data: records} = await listWallets(user.tenantId, {
    search: q,
    channel,
    status,
  });

  const wallets: WalletAccount[] = records
    .filter((wallet) => wallet.farmer)
    .map((wallet) => {
      const latest = wallet.entries[0]?.transaction;
      return {
        id: wallet.id,
        farmerName: wallet.farmer!.name,
        farmerCode: wallet.farmer!.code,
        phoneNumber: wallet.farmer!.phoneE164,
        accountType: 'MOBILE_MONEY',
        availableBalance: wallet.cachedBalance.toNumber(),
        pendingBalance: 0,
        lastTransaction: {
          type:
            latest?.type === 'LOAN_DISBURSEMENT'
              ? 'LOAN_DISBURSEMENT'
              : latest?.type === 'LOAN_REPAYMENT'
              ? 'LOAN_REPAYMENT'
              : latest?.type === 'WITHDRAWAL'
              ? 'WITHDRAWAL'
              : 'PRODUCE_PAYOUT',
          amount: latest?.amount.toNumber() ?? 0,
          date:
            latest?.createdAt.toLocaleDateString('en-KE', {
              day: '2-digit',
              month: 'short',
            }) ?? 'No activity',
        },
        status: 'ACTIVE',
      };
    });

  // Calculate KPI metrics from wallet data
  const totalLedgerValue = wallets.reduce((acc: number, w: any) => acc + w.availableBalance, 0);
  const pendingReserve = wallets.reduce((acc: number, w: any) => acc + w.pendingBalance, 0);
  const activeWallets = wallets.length;
  const flaggedCount = wallets.filter((w) => w.status === 'FLAGGED').length;

  const kpis = [
    {
      label: 'Total Ledger Value',
      value: `KES ${totalLedgerValue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      sub: `${activeWallets} active wallets`,
      accent: 'hsl(var(--agri-leaf))',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Pending Reserve',
      value: `KES ${pendingReserve.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      sub: 'Awaiting QA verification',
      accent: 'hsl(var(--agri-harvest))',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: 'Active Wallets',
      value: activeWallets.toLocaleString(),
      sub: 'Registered farmers',
      accent: 'hsl(var(--agri-lime))',
      icon: <ArrowUpRight className="h-4 w-4" />,
    },
    {
      label: 'Security Holds',
      value: `${flaggedCount} Accounts`,
      sub: 'Flagged for review',
      accent: 'hsl(var(--agri-harvest))',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Digital Wallet Ledger"
        title="Farmer Wallets"
        description="Manage virtual balances, process automated mobile money payouts, and review ledger balances."
      >
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm border border-border hover:bg-secondary/80 transition-colors">
          <RefreshCw className="h-4 w-4" />
          Reconcile
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors">
          <Send className="h-4 w-4" />
          Initiate Batch Payout
        </button>
      </PageHeader>

      {/* Wallet KPI Cards */}
      <KPI kpis={kpis} />

      {/* Search & Multi-Filter Toolbar */}
      <DataTableFilterBar placeholder="Search by name, code, or phone…">
        <FilterSelect
          paramKey="channel"
          options={[
            { label: 'All Payout Channels', value: 'ALL' },
            { label: 'Mobile Money', value: 'MOBILE_MONEY' },
            { label: 'Bank Account', value: 'BANK' },
          ]}
        />
        <FilterSelect
          paramKey="status"
          options={[
            { label: 'All Wallet Statuses', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Security Hold', value: 'FLAGGED' },
            { label: 'Frozen', value: 'FROZEN' },
          ]}
        />
      </DataTableFilterBar>

      {/* Wallets Table */}
      <WalletsDataTable wallets={wallets} />
    </div>
  );
}