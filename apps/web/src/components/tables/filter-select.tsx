// components/tables/filter-select.tsx
'use client';

import { FilterSelect as UIFilterSelect, type Option } from '@cashflow/ui';
import { useFilterParams } from '@/hooks/use-filter-params';

interface AppFilterSelectProps {
  paramKey: string;
  options: Option[];
  defaultValue?: string;
  className?: string;
}

export function FilterSelect({
  paramKey,
  options,
  defaultValue = 'ALL',
  className = '',
}: AppFilterSelectProps) {
  const { getParam, setFilter } = useFilterParams();
  const currentValue = getParam(paramKey) || defaultValue;

  return (
    <UIFilterSelect
      value={currentValue}
      onChange={(value) => setFilter(paramKey, value)}
      options={options}
      className={className}
    />
  );
}