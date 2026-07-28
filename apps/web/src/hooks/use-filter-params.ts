// hooks/use-filter-params.ts
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useState, useEffect, useCallback } from 'react';

export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const getParam = useCallback(
    (key: string) => searchParams.get(key) || '',
    [searchParams]
  );

  const [search, setSearch] = useState(getParam('q'));

  useEffect(() => {
    setSearch(getParam('q'));
  }, [searchParams, getParam]);

  const updateFilters = useCallback(
    (newParams: Record<string, string | null | undefined>) => {
      // Start with current URL search params to preserve all other active filters
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== 'ALL') {
          params.set(key, value.trim());
        } else {
          params.delete(key);
        }
      });

      // Always reset pagination when filters change
      params.delete('page');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced search input trigger
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (search.trim() === currentQ) return;

    const timer = setTimeout(() => {
      updateFilters({ q: search });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchParams, updateFilters]);

  // Direct parameter setter for dropdowns
  const setFilter = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };

  return {
    search,
    setSearch,
    setFilter,
    getParam,
    isPending,
  };
}