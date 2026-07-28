'use client';

import React, { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@cashflow/ui';
import { KPI } from '@cashflow/ui';
import CollectionsTable, { Collection } from '@/components/tables/collectionsTable';
import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';
import { useRouter } from 'next/navigation';
import { CollectionLogModal } from '@/components/forms/collection-log-form';

interface CollectionsPageClientProps {
  collections: Collection[];
  kpis: any[];
}

export default function CollectionsPageClient({ collections, kpis }: CollectionsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      <PageHeader
        subtitle="Collections ledger"
        title="Produce intake & valuations"
        description="Verify field submissions, inspect per-batch deductions, and clear for wallet payout."
      >
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-background text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          Export CSV
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Log collection
        </button>
      </PageHeader>

      <KPI kpis={kpis} />

      <DataTableFilterBar placeholder="Search by name, code, or phone…">
        <FilterSelect
          paramKey="commodity"
          options={[
            { label: 'All commodities', value: 'ALL' },
            { label: 'Coffee', value: 'COFFEE' },
            { label: 'Tea', value: 'TEA' },
            { label: 'Macadamia', value: 'MACADAMIA' },
            { label: 'Avocado', value: 'AVOCADO' },
            { label: 'Milk', value: 'MILK' },
            { label: 'Maize', value: 'MAIZE' },
          ]}
        />
        <FilterSelect
          paramKey="status"
          options={[
            { label: 'All statuses', value: 'ALL' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Valuated', value: 'VALUATED' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ]}
        />
        <FilterSelect
          paramKey="grade"
          options={[
            { label: 'All grades', value: 'ALL' },
            { label: 'Grade A', value: 'GRADE_A' },
            { label: 'Grade B', value: 'GRADE_B' },
            { label: 'Grade C', value: 'GRADE_C' },
            { label: 'Premium', value: 'PREMIUM' },
            { label: 'Standard', value: 'STANDARD' },
            { label: 'Reject', value: 'REJECT' },
          ]}
        />
      </DataTableFilterBar>

      <CollectionsTable collections={collections} />

      <CollectionLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}