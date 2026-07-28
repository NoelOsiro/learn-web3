'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  DollarSign,
  TrendingUp,
  BookOpen,
  Star,
} from 'lucide-react';
import { CommodityType } from '@cashflow/database';
import { trpc } from '@/lib/trpc/client';
import { PageHeader, KPI } from '@cashflow/ui';
import PriceBookDataTable from '@/components/tables/pricebooksTable';
import { DataTableFilterBar } from '@/components/tables/data-table-filter-bar';
import { FilterSelect } from '@/components/tables/filter-select';
import { PriceBookModal } from '@/components/price-books/price-book-modal';
import { toast } from 'sonner';

export default function PriceBooksPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const commodity = searchParams.get('commodity') as CommodityType | undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: priceBooksData, isLoading, refetch } = trpc.priceBooks.list.useQuery({
    search: q,
    commodity: commodity,
    limit: 100,
  });

  const setDefaultMutation = trpc.priceBooks.setDefault.useMutation({
    onSuccess: () => {
      toast.success('Price book set as default');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set default price book');
    },
  });

  const deleteMutation = trpc.priceBooks.delete.useMutation({
    onSuccess: () => {
      toast.success('Price book deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete price book');
    },
  });

  const rawPriceBooks = priceBooksData?.data || [];

  // Calculate metrics
  const activePriceBooks = rawPriceBooks.filter((pb) => {
    const now = new Date();
    const validFrom = new Date(pb.validFrom);
    const validTo = pb.validTo ? new Date(pb.validTo) : null;
    return validFrom <= now && (!validTo || validTo >= now);
  });

  const defaultPriceBooks = rawPriceBooks.filter((pb) => pb.isDefault);
  const totalLines = rawPriceBooks.reduce((acc, pb) => acc + pb.lines.length, 0);

  // Average price per unit across all lines
  const allPrices = rawPriceBooks.flatMap((pb) =>
    pb.lines.map((line: { pricePerUnit: string }) => Number(line.pricePerUnit))
  );
  const avgPrice = allPrices.length > 0
    ? allPrices.reduce((acc: number, price: number) => acc + price, 0) / allPrices.length
    : 0;

  // Count by commodity
  const commodityCounts = rawPriceBooks.reduce((acc: Record<string, number>, pb: { commodity: string }) => {
    acc[pb.commodity] = (acc[pb.commodity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis = [
    {
      label: 'Active Price Books',
      value: activePriceBooks.length.toString(),
      sub: `${defaultPriceBooks.length} set as default`,
      accent: 'hsl(var(--agri-leaf))',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: 'Total Price Lines',
      value: totalLines.toString(),
      sub: 'Across all commodities',
      accent: 'hsl(var(--agri-lime))',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Avg Price/Unit',
      value: `KES ${avgPrice.toFixed(2)}`,
      sub: 'Weighted average',
      accent: 'hsl(var(--agri-harvest))',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: 'Commodities',
      value: Object.keys(commodityCounts).length.toString(),
      sub: 'Types configured',
      accent: 'hsl(var(--agri-sky))',
      icon: <Star className="h-4 w-4" />,
    },
  ];

  const handleViewLines = (id: string) => {
    const priceBook = rawPriceBooks.find((pb) => pb.id === id);
    if (priceBook) {
      setEditData(priceBook);
      setIsModalOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const priceBook = rawPriceBooks.find((pb) => pb.id === id);
    if (priceBook) {
      setEditData(priceBook);
      setIsModalOpen(true);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate({ id });
  };

  const handleDuplicate = (id: string) => {
    const priceBook = rawPriceBooks.find((pb) => pb.id === id);
    if (priceBook) {
      const duplicated = {
        ...priceBook,
        id: '',
        name: `${priceBook.name} (Copy)`,
        isDefault: false,
      };
      setEditData(duplicated);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this price book? This action cannot be undone.')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreate = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Farmer Loan Facilities"
        title="Price Books & Valuation Matrix"
        description="Configure base commodity rates, grade-level pricing matrices, and active schedules for real-time delivery valuation."
      >
        <button 
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Price Book
        </button>
      </PageHeader>

      {/* Summary KPI Cards Component */}
      <KPI kpis={kpis} />

      {/* Filters Toolbar */}
      <DataTableFilterBar placeholder="Search by name…">
        <FilterSelect
          paramKey="commodity"
          options={[
            { label: 'All Commodities', value: 'ALL' },
            { label: 'Milk', value: 'MILK' },
            { label: 'Maize', value: 'MAIZE' },
            { label: 'Coffee', value: 'COFFEE' },
            { label: 'Avocado', value: 'AVOCADO' },
            { label: 'Macadamia', value: 'MACADAMIA' },
            { label: 'Tea', value: 'TEA' },
          ]}
        />
      </DataTableFilterBar>

      {/* Price Books Data Table */}
      {isLoading ? (
        <div className="rounded-xl bg-card border border-border shadow-sm p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <PriceBookDataTable 
          pricebooks={rawPriceBooks}
          onViewLines={handleViewLines}
          onEdit={handleEdit}
          onSetDefault={handleSetDefault}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}

      {/* Create/Edit Modal */}
      <PriceBookModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={() => {
          refetch();
          handleModalClose();
        }}
        editData={editData}
      />
    </div>
  );
}
