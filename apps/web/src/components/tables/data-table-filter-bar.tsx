// components/tables/data-table-filter-bar.tsx
'use client';

import { ReactNode } from 'react';
import { FilterToolbar } from '@cashflow/ui';
import { useFilterParams } from '@/hooks/use-filter-params';

interface DataTableFilterBarProps {
  placeholder?: string;
  children?: ReactNode;
}

export function DataTableFilterBar({
  placeholder = 'Search...',
  children,
}: DataTableFilterBarProps) {
  const { search, setSearch, isPending } = useFilterParams();

  return (
    <div className={isPending ? 'opacity-60 transition-opacity' : ''}>
      <FilterToolbar
        placeholder={placeholder}
        value={search}
        onChange={setSearch}
      >
        {children}
      </FilterToolbar>
    </div>
  );
}