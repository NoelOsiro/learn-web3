// app/dashboard/reports/page.tsx
import {
  Download,
  FileText,
  Calendar,
  Filter,
  Package,
  Users,
  Landmark,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { PageHeader, KPI } from '@cashflow/ui';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  category: 'FINANCIAL' | 'COLLECTIONS' | 'CREDIT' | 'COMPLIANCE';
  lastGenerated: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  fileSize: string;
}

const mockReports: ReportTemplate[] = [
  {
    id: '1',
    title: 'Monthly Produce Yield & Collection Summary',
    description: 'Comprehensive breakdown of total kg harvested, crop grades, and unit valuations by center.',
    category: 'COLLECTIONS',
    lastGenerated: 'Jul 24, 2026',
    format: 'CSV',
    fileSize: '2.4 MB',
  },
  {
    id: '2',
    title: 'Loan Portfolio at Risk (PAR 30/60/90)',
    description: 'Detailed analysis of delinquent loan balances, collateral coverage gaps, and default projections.',
    category: 'CREDIT',
    lastGenerated: 'Jul 20, 2026',
    format: 'PDF',
    fileSize: '1.8 MB',
  },
  {
    id: '3',
    title: 'Cooperative Settlement & Farmer Payout Audit',
    description: 'Itemized statement of net farmer earnings post-loan deductions and processing fees.',
    category: 'FINANCIAL',
    lastGenerated: 'Jul 15, 2026',
    format: 'XLSX',
    fileSize: '4.1 MB',
  },
  {
    id: '4',
    title: 'Farmer KYC & AML Compliance Log',
    description: 'Export of verified farmer identity documents, geographic footprints, and sanction checks.',
    category: 'COMPLIANCE',
    lastGenerated: 'Jul 01, 2026',
    format: 'PDF',
    fileSize: '950 KB',
  },
];

export default function ReportsPage() {
  const kpis = [
    {
      label: 'Season Disbursed',
      value: 'KES 384,200.00',
      sub: '+18.4% compared to 2025',
      accent: 'hsl(var(--agri-leaf))',
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      label: 'Total Harvest Weight',
      value: '1,240.5 Tons',
      sub: '+8.2% yield optimization',
      accent: 'hsl(var(--agri-lime))',
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Net Farmer Payout',
      value: 'KES 912,450.00',
      sub: '98.2% settled on time',
      accent: 'hsl(var(--agri-harvest))',
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Financial & Operational Reports"
        title="Reports Center"
        description="Generate, schedule, and export audited reports for crop collections and lending portfolios."
      >
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors">
          <Sparkles className="h-4 w-4" />
          Create Custom Report
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <KPI kpis={kpis} />

      {/* Custom Export Query Builder */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Quick Data Export Builder
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Report Type
            </label>
            <select className="w-full bg-background border border-border px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Crop Intake & Valuation</option>
              <option>Loan Disbursement & Repayment</option>
              <option>Cooperative Balances</option>
              <option>Farmer Wallet Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Date Range
            </label>
            <div className="relative">
              <select className="w-full bg-background border border-border px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Current Season (2026)</option>
                <option>Last 30 Days</option>
                <option>Last Quarter (Q2 2026)</option>
                <option>Full Year 2025</option>
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              File Format
            </label>
            <select className="w-full bg-background border border-border px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>CSV (Raw Data)</option>
              <option>Excel (.xlsx)</option>
              <option>PDF (Formatted Audit)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 border border-border transition-colors">
              <Download className="h-4 w-4" />
              Download Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Available Pre-Generated Reports */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Standard Audit Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockReports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CategoryBadge category={report.category} />
                  <span className="text-xs font-mono text-muted-foreground">
                    {report.fileSize}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  {report.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Last run: {report.lastGenerated}</span>
                <button className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" />
                  Download {report.format}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: ReportTemplate['category'] }) {
  switch (category) {
    case 'COLLECTIONS':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Collections
        </span>
      );
    case 'CREDIT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Credit Risk
        </span>
      );
    case 'FINANCIAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          Financial
        </span>
      );
    case 'COMPLIANCE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          Compliance
        </span>
      );
  }
}