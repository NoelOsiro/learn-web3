// app/dashboard/farmers/page.tsx
import { Users, Plus, CheckCircle2, Wallet, Landmark } from 'lucide-react';
import { listFarmers } from '@cashflow/farmers';
import { getCurrentUser } from '@/lib/auth/session';
import { PageHeader, KPI } from '@cashflow/ui';
import { FarmersTable, FarmerUI, KYCStatus } from '@/components/tables/farmersTable';
import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';
import Link from 'next/link';


interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function FarmersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  // Pass URL params straight to the database query
  const { data: rawFarmers } = await listFarmers(user.tenantId, {
    limit: 100,
    search: q,
    status: status,
  });

  const farmers: FarmerUI[] = rawFarmers.map((f) => {
    const walletBalance = f.wallets?.cachedBalance.toNumber() ?? 0;

    const activeLoan = f.credits.reduce(
      (acc, c) => acc + c.amount.toNumber(),
      0
    );

    let kycStatus: KYCStatus = 'VERIFIED';
    if (!f.isActive) {
      kycStatus = 'SUSPENDED';
    } else if (!f.idNumber) {
      kycStatus = 'PENDING';
    }

    return {
      id: f.id,
      farmerCode: f.code,
      name: f.name,
      phone: f.phoneE164,
      location: f.location || f.address || 'Unspecified Location',
      primaryCrop: 'General Produce',
      acreage: 0,
      walletBalance,
      activeLoan,
      kycStatus,
      joinedDate: new Date(f.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    };
  });

  // KPI Calculations
  const totalFarmers = farmers.length;
  const verifiedCount = farmers.filter((f) => f.kycStatus === 'VERIFIED').length;
  const kycRatio = totalFarmers > 0 ? ((verifiedCount / totalFarmers) * 100).toFixed(1) : '0';
  const activeBorrowersCount = farmers.filter((f) => f.activeLoan > 0).length;
  const totalLoanExposure = farmers.reduce((acc, f) => acc + f.activeLoan, 0);

  const kpis = [
    {
      label: 'Total Farmers',
      value: totalFarmers.toLocaleString(),
      sub: 'Matching current filter',
      icon: <Users className="h-4 w-4" />,
      accent: 'hsl(var(--agri-leaf))',
    },
    {
      label: 'KYC Verified',
      value: `${verifiedCount} (${kycRatio}%)`,
      sub: 'Verification rate',
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: 'hsl(var(--agri-lime))',
    },
    {
      label: 'Active Borrowers',
      value: activeBorrowersCount.toLocaleString(),
      sub: 'Farmers with active loans',
      icon: <Landmark className="h-4 w-4" />,
      accent: 'hsl(var(--agri-harvest))',
    },
    {
      label: 'Total Loan Exposure',
      value: `KES ${totalLoanExposure.toLocaleString()}`,
      sub: 'Total outstanding loans',
      icon: <Wallet className="h-4 w-4" />,
      accent: 'hsl(var(--agri-gold))',
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      <PageHeader
        subtitle="Farmer Directory"
        title="Farmers Management"
        description="Manage registered cooperative farmers, verify KYC, and track credit health."
      >
        {user.role === "TENANT_ADMIN" && (
          <Link
            href="/dashboard/farmers/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Register New Farmer
          </Link>
        )}

      </PageHeader>

      <KPI kpis={kpis} />

      {/* Interactive Server-Connected Toolbar */}
      <DataTableFilterBar placeholder="Search by name, code, or phone…">
        <FilterSelect
          paramKey="status"
          options={[
            { label: 'All KYC Statuses', value: 'ALL' },
            { label: 'Verified', value: 'VERIFIED' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Suspended', value: 'SUSPENDED' },
          ]}
        />
      </DataTableFilterBar>

      <FarmersTable farmers={farmers} />
    </div>
  );
}