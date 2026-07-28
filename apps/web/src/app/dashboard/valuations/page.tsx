'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Download,
  FileText,
  Calculator,
  Trash2,
  MoreVertical,
  X,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';



import { toast } from 'sonner';
import { KPI, PageHeader, TableShell } from '@cashflow/ui';

interface DeductionItem {
  category: string;
  amount: number;
  type?: 'FIXED' | 'PERCENTAGE';
  percentage?: number;
}

interface ValuationWithRelations {
  id: string;
  calculatedAt: string | Date;
  grossAmount: { toString: () => string } | string | number;
  currency: string;
  deductions: any;
  netAmount: { toString: () => string } | string | number;
  notes: string | null;
  collection: {
    id: string;
    quantity: { toString: () => string } | string | number;
    grade: string;
    unit: string;
    commodity: string;
    farmer: {
      id: string;
      name: string;
    };
  };
  credits: Array<{
    id: string;
    amount: { toString: () => string } | string | number;
    currency: string;
  }>;
}

export default function ValuationsPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const currency = searchParams.get('currency') || undefined;
  const dateRange = (searchParams.get('dateRange') as 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM' | null) || undefined;
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

  const [selectedValuation, setSelectedValuation] = useState<ValuationWithRelations | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const { data: valuationsData, isLoading, refetch } = trpc.valuations.getValuations.useQuery({
    search: q,
    currency,
    dateRange,
    dateFrom,
    dateTo,
    limit: 100,
  });

  const updateNotesMutation = trpc.valuations.updateValuationNotes.useMutation({
    onSuccess: () => {
      toast.success('Audit notes updated');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });

  const recalculateMutation = trpc.valuations.recalculateValuation.useMutation({
    onSuccess: () => {
      toast.success('Valuation recalculated successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to recalculate valuation');
    },
  });

  const softDeleteMutation = trpc.valuations.softDelete.useMutation({
    onSuccess: () => {
      toast.success('Valuation archived');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive valuation');
    },
  });

  const valuations = (valuationsData?.data || []) as any[];

  // Calculate KPI metrics with explicit callback types to prevent TS infinite depth recursion
  const totalGross = valuations.reduce(
    (acc: number, v: any) => acc + Number(v.grossAmount ?? 0),
    0
  );

  const totalDeductions = valuations.reduce(
    (acc: number, v: any) => {
      const deductions = (v.deductions as unknown as DeductionItem[]) || [];
      const itemSum = deductions.reduce(
        (sum: number, d: any) => sum + (Number(d.amount) || 0),
        0
      );
      return acc + itemSum;
    },
    0
  );

  const totalNet = valuations.reduce(
    (acc: number, v: any) => acc + Number(v.netAmount ?? 0),
    0
  );



  const avgMargin = totalGross > 0 ? (totalNet / totalGross) * 100 : 0;

  const kpis = [
    {
      label: 'Total Valued (Gross)',
      value: `${valuations[0]?.currency || 'KES'} ${totalGross.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${valuations.length} valuations`,
      accent: 'hsl(var(--agri-leaf))',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Total Deductions',
      value: `${valuations[0]?.currency || 'KES'} ${totalDeductions.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Applied across all valuations',
      accent: 'hsl(var(--destructive))',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: 'Net Payable',
      value: `${valuations[0]?.currency || 'KES'} ${totalNet.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Final payout amount',
      accent: 'hsl(var(--agri-lime))',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Avg Net Margin %',
      value: `${avgMargin.toFixed(2)}%`,
      sub: 'Net / Gross ratio',
      accent: 'hsl(var(--agri-harvest))',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ].filter((kpi) => kpi !== null);

  const handleViewBreakdown = (valuation: any) => {
    setSelectedValuation(valuation);
    setNotesValue(valuation.notes || '');
  };

  const handleRecalculate = (id: string) => {
    if (confirm('Are you sure you want to recalculate this valuation against the latest price book?')) {
      recalculateMutation.mutate({ id });
    }
  };

  const handleSoftDelete = (id: string) => {
    if (confirm('Are you sure you want to archive this valuation?')) {
      softDeleteMutation.mutate({ id });
    }
  };

  const handleSaveNotes = () => {
    if (selectedValuation) {
      updateNotesMutation.mutate({
        id: selectedValuation.id,
        notes: notesValue,
      });
    }
  };

  const handleExport = () => {
    toast.info('Export functionality - CSV/PDF export would be implemented here');
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Financial Audit"
        title="Valuations & Financial Audit"
        description="Review automated commodity payout calculations, track applied deductions, and inspect payout balances."
      >
        <button 
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm border border-border hover:bg-secondary/80 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV / PDF
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <KPI kpis={kpis} />

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <input
            placeholder="Search by Valuation ID, Collection ID, or Farmer Name..."
            className="h-11 w-full rounded-xl border border-border bg-background pl-4 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={q || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set('q', e.target.value);
              } else {
                params.delete('q');
              }
              window.history.pushState(null, '', `?${params.toString()}`);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set('dateRange', e.target.value);
              } else {
                params.delete('dateRange');
              }
              window.history.pushState(null, '', `?${params.toString()}`);
            }}
            className="appearance-none bg-background border border-border px-3 py-2 pr-8 rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Time</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
          <select
            value={currency || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set('currency', e.target.value);
              } else {
                params.delete('currency');
              }
              window.history.pushState(null, '', `?${params.toString()}`);
            }}
            className="appearance-none bg-background border border-border px-3 py-2 pr-8 rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Currencies</option>
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Valuations Data Table */}
      {isLoading ? (
        <div className="rounded-xl bg-card border border-border shadow-sm p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <TableShell
          summary={
            <p className="text-xs text-muted-foreground">{valuations.length} valuation{valuations.length === 1 ? '' : 's'} in the directory</p>
          }
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Valuation ID & Date</th>
                <th className="px-6 py-3.5">Collection Intake</th>
                <th className="px-6 py-3.5 text-right">Gross Amount</th>
                <th className="px-6 py-3.5 text-right">Total Deductions</th>
                <th className="px-6 py-3.5 text-right">Net Amount</th>
                <th className="px-6 py-3.5">Linked Credits</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {valuations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No valuations found for the selected filters.
                  </td>
                </tr>
              ) : (valuations as any[]).map((valuation) => { // @ts-ignore
                const deductions = valuation.deductions as unknown as DeductionItem[];
                const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
                const idSnippet = `#VAL-${valuation.id.slice(0, 6)}`;
                const formattedDate = new Date(valuation.calculatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={valuation.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-foreground">{idSnippet}</div>
                      <div className="text-xs text-muted-foreground">{formattedDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{valuation.collection.farmer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Collection: {valuation.collection.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Number(valuation.collection.quantity).toFixed(2)} {valuation.collection.unit} - {valuation.collection.commodity} {valuation.collection.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {valuation.currency} {Number(valuation.grossAmount).toLocaleString('en-KE', { minimumFractionDigits: 4 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-destructive font-semibold">
                        {valuation.currency} -{totalDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        [{deductions.length} items]
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {valuation.currency} {Number(valuation.netAmount).toLocaleString('en-KE', { minimumFractionDigits: 4 })}
                    </td>
                    <td className="px-6 py-4">
                      {valuation.credits.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {valuation.credits.length} Credit{valuation.credits.length > 1 ? 's' : ''} Attached
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No credits</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                            dropdown.classList.toggle('hidden');
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="hidden absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => handleViewBreakdown(valuation)}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Full Breakdown
                          </button>
                          <button
                            onClick={() => handleRecalculate(valuation.id)}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                          >
                            <Calculator className="h-4 w-4" />
                            Recalculate Valuation
                          </button>
                          <button
                            onClick={() => {
                              setSelectedValuation(valuation);
                              setNotesValue(valuation.notes || '');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Add Audit Note
                          </button>
                          <div className="border-t border-border my-1" />
                          <button
                            onClick={() => handleSoftDelete(valuation.id)}
                            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Soft Delete / Archive
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}

      {/* Valuation Detail Drawer */}
      {selectedValuation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedValuation(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-xl shadow-xl border border-border">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Valuation Breakdown</h3>
                <p className="text-sm text-muted-foreground">
                  #{selectedValuation.id.slice(0, 8)} - {selectedValuation.collection.farmer.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedValuation(null)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Breakdown Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Financial Breakdown
                </h4>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Calculation</span>
                    <span className="text-sm font-medium text-foreground">
                      {Number(selectedValuation.collection.quantity).toFixed(2)} {selectedValuation.collection.unit} × Rate
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Amount</span>
                    <span className="text-sm font-bold text-foreground">
                      {selectedValuation.currency} {Number(selectedValuation.grossAmount).toLocaleString('en-KE', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-2 border-b border-border">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applied Deductions</h5>
                  </div>
                  <div className="divide-y divide-border">
                    {(selectedValuation.deductions as unknown as DeductionItem[]).map((deduction, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            deduction.type === 'PERCENTAGE' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {deduction.type === 'PERCENTAGE' ? '%' : '$'}
                          </span>
                          <span className="text-sm font-medium text-foreground">{deduction.category}</span>
                          {deduction.percentage && (
                            <span className="text-xs text-muted-foreground">({deduction.percentage}%)</span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-destructive">
                          -{selectedValuation.currency} {deduction.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Net Payable Summary */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Net Payable</span>
                      <p className="text-xs text-emerald-600 mt-0.5">Final payout after all deductions</p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">
                      {selectedValuation.currency} {Number(selectedValuation.netAmount).toLocaleString('en-KE', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Credit Facilities */}
              {selectedValuation.credits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Linked Credit Facilities
                  </h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="divide-y divide-border">
                      {selectedValuation.credits.map((credit) => (
                        <div key={credit.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                          <div>
                            <span className="text-sm font-medium text-foreground">Credit #{credit.id.slice(0, 8)}</span>
                            <p className="text-xs text-muted-foreground">Recovery applied against this valuation</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {credit.currency} {Number(credit.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Admin Notes
                </h4>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add audit notes or observations..."
                  className="w-full min-h-[100px] rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateNotesMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
