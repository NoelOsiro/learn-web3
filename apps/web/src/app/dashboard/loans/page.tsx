'use client';

// app/dashboard/loans/page.tsx
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  DollarSign,
  TrendingUp,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { CreditStatus } from '@cashflow/database';
import { trpc } from '@/lib/trpc/client';
import { PageHeader, KPI } from '@cashflow/ui';
import LoansDataTable from '@/components/tables/loansTable';
import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';

export interface LoanFacilityUI {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerCode: string;
  loanType: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  collateralCoverage: number;
  status: CreditStatus;
  dueDate: string;
  disbursedAt: string;
}

export default function LoansPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const status = searchParams.get('status') || undefined;

  const { data: loansData, isLoading } = trpc.loans.list.useQuery({
    search: q,
    status: status,
    limit: 100,
  });

  const rawCredits = loansData?.data || [];

  // Calculate beginning of current year for YTD metrics
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Transform Prisma records to UI interface
  const loans: LoanFacilityUI[] = rawCredits.map((credit) => {
    const principal = Number(credit.amount);

    // Sum all processed repayments
    const totalRepaid = credit.repayments.reduce(
      (acc, r) => acc + Number(r.amount),
      0
    );

    // Calculate remaining principal/outstanding balance
    const outstandingBalance = Math.max(0, principal - totalRepaid);

    // Dynamic Collateral Coverage calculation: Valuation/Collection value vs Loan Principal
    const collateralValue = Number(
      credit.valuation?.netAmount ?? credit.collection?.netAmount ?? 0
    );

    const collateralCoverage =
      principal > 0 ? Math.round((collateralValue / principal) * 100) : 0;

    return {
      id: credit.id,
      loanNumber: `LN-${credit.id.slice(0, 8).toUpperCase()}`,
      borrowerName: credit.farmer.name,
      borrowerCode: credit.farmer.code,
      loanType: credit.purpose || 'General Advance',
      principalAmount: principal,
      outstandingBalance,
      interestRate: Number(credit.interestRate),
      collateralCoverage,
      status: credit.status,
      dueDate: new Date(credit.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      disbursedAt: new Date(credit.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };
  });

  // Dynamic Metrics Aggregations
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const activePortfolioTotal = activeLoans.reduce(
    (acc, l) => acc + l.outstandingBalance,
    0
  );

  const totalDisbursedYTD = rawCredits
    .filter((c) => new Date(c.startDate) >= startOfYear)
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const defaultedCount = loans.filter((l) => l.status === 'DEFAULTED').length;
  const par30Ratio =
    loans.length > 0 ? ((defaultedCount / loans.length) * 100).toFixed(1) : '0.0';

  const avgCollateral =
    loans.length > 0
      ? Math.round(
        loans.reduce((acc, l) => acc + l.collateralCoverage, 0) / loans.length
      )
      : 0;

  const kpis = [
    {
      label: 'Active Portfolio',
      value: `KES ${activePortfolioTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      sub: `${activeLoans.length} active facilities`,
      accent: 'hsl(var(--agri-leaf))',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Disbursed YTD',
      value: `KES ${totalDisbursedYTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      sub: 'Current calendar year',
      accent: 'hsl(var(--agri-lime))',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: 'Default Rate',
      value: `${par30Ratio}%`,
      sub: `${defaultedCount} facilities in default`,
      accent: 'hsl(var(--agri-harvest))',
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      label: 'Avg Collateral',
      value: `${avgCollateral}%`,
      sub: 'Crop yield valuation coverage',
      accent: 'hsl(var(--agri-sky))',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Farmer Loan Facilities"
        title="Loan Management"
        description="Issue crop-backed advances, track repayment health, and review loan portfolios."
      >
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Issue New Loan
        </button>
      </PageHeader>

      {/* Summary KPI Cards Component */}
      <KPI kpis={kpis} />

      {/* Filters Toolbar */}
      <DataTableFilterBar placeholder="Search by name, code, or phone…">
            <FilterSelect
              paramKey="status"
              options={[
                { label: 'All Loan Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Pending Approval', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Defaulted', value: 'DEFAULTED' },
                { label: 'Fully Paid', value: 'PAID' },
              ]}
            />
          </DataTableFilterBar>

      {/* Loans Data Table */}
      {isLoading ? (
        <div className="rounded-xl bg-card border border-border shadow-sm p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <LoansDataTable loans={loans} />
      )}
    </div>
  );
}

