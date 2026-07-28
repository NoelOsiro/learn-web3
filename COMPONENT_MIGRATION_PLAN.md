# Component Migration Plan: Moving to @cashflow/ui

## Overview
This document outlines the step-by-step process to move reusable components from the web app to the shared UI package (`@cashflow/ui`). This reduces code duplication and ensures consistent theming across the application.

## Current State
- **UI Package**: `e:\learn-web3\packages\ui\`
  - Already has: Button, Card, Input, cn utility
  - Exports from: `src/index.ts`
- **Web App Components**: `e:\learn-web3\apps\web\src\components\`
  - Tables: table-shell.tsx, filter-select.tsx, data-table-filter-bar.tsx
  - Dashboard: PageHeadr.tsx, kpi.tsx, dashboard-shell.tsx

## Components to Move

### Priority 1: Table Components (High Impact)
1. **TableShell** - Wraps all tables with consistent styling
2. **FilterToolbar** - Search input with clear button and filter slot
3. **FilterSelect** - Dropdown filter for table columns

### Priority 2: Dashboard Components (Medium Impact)
4. **PageHeader** - Standardized page titles with action slots
5. **KPI** - Key performance indicator cards with accent borders

## Migration Steps

### Step 1: Move TableShell and FilterToolbar
**File**: `e:\learn-web3\apps\web\src\components\tables\table-shell.tsx`

**Actions**:
1. Copy `table-shell.tsx` to `e:\learn-web3\packages\ui\src\table-shell.tsx`
2. Update imports in new file:
   - Remove any app-specific imports
   - Keep: `import { Search, X } from "lucide-react"`
   - Keep: `import { ReactNode } from "react"`
3. Add to `packages/ui/src/index.ts`:
   ```ts
   export { FilterToolbar, TableShell } from './table-shell';
   export type { FilterToolbarProps } from './table-shell';
   ```
4. Build UI package: `cd packages/ui && npm run build`
5. Update imports in web app:
   - Find: `import { FilterToolbar, TableShell } from '@/components/tables/table-shell'`
   - Replace: `import { FilterToolbar, TableShell } from '@cashflow/ui'`
6. Delete old file: `e:\learn-web3\apps\web\src\components\tables\table-shell.tsx`

### Step 2: Move FilterSelect
**File**: `e:\learn-web3\apps\web\src\components\tables\filter-select.tsx`

**Actions**:
1. Copy `filter-select.tsx` to `e:\learn-web3\packages\ui\src\filter-select.tsx`
2. **CRITICAL**: This component depends on `useFilterParams` hook from the web app
   - Option A: Move the hook to UI package (if it's generic)
   - Option B: Make FilterSelect accept value/onChange props instead of using the hook
   - **Recommended**: Option B - make it more generic
3. Refactor FilterSelect to accept props:
   ```ts
   interface FilterSelectProps {
     value: string;
     onChange: (value: string) => void;
     options: Option[];
     className?: string;
   }
   ```
4. Add to `packages/ui/src/index.ts`
5. Build UI package
6. Update usage in web app to pass value/onChange from useFilterParams
7. Delete old file

### Step 3: Move PageHeader
**File**: `e:\learn-web3\apps\web\src\components\dashboard\PageHeadr.tsx`

**Actions**:
1. Copy to `e:\learn-web3\packages\ui\src\page-header.tsx`
2. Rename file from `PageHeadr.tsx` (typo) to `page-header.tsx`
3. Add to `packages/ui/src/index.ts`
4. Build UI package
5. Update imports:
   - Find: `import { PageHeader } from '@/components/dashboard/PageHeadr'`
   - Replace: `import { PageHeader } from '@cashflow/ui'`
6. Delete old file

### Step 4: Move KPI Component
**File**: `e:\learn-web3\apps\web\src\components\dashboard\kpi.tsx`

**Actions**:
1. Copy to `e:\learn-web3\packages\ui\src\kpi.tsx`
2. Convert default export to named export:
   ```ts
   export function KPI({ kpis }: { kpis: KPI[] }) { ... }
   export type { KPI } from './kpi';
   ```
3. Add to `packages/ui/src/index.ts`
4. Build UI package
5. Update imports in web app
6. Delete old file

### Step 5: Handle DataTableFilterBar
**File**: `e:\learn-web3\apps\web\src\components\tables\data-table-filter-bar.tsx`

**Actions**:
1. This component wraps FilterToolbar with app-specific logic (useFilterParams)
2. **DO NOT MOVE** - keep in web app as it's app-specific
3. Update its import to use the moved FilterToolbar from @cashflow/ui

### Step 6: Update Dependencies (if needed)
Check if UI package needs additional dependencies:
- Review `packages/ui/package.json`
- Add any missing Radix UI components or other dependencies
- Run `cd packages/ui && npm install`

### Step 7: Verify and Test
1. Build UI package: `cd packages/ui && npm run build`
2. Build web app: `cd apps/web && npm run build`
3. Run dev server and test all pages
4. Check for any broken imports or missing types

## Import Migration Pattern

### Before:
```tsx
import { FilterToolbar, TableShell } from '@/components/tables/table-shell';
import { PageHeader } from '@/components/dashboard/PageHeadr';
import KPI from '@/components/dashboard/kpi';
```

### After:
```tsx
import { FilterToolbar, TableShell, PageHeader, KPI } from '@cashflow/ui';
```

## Files Requiring Import Updates

Based on grep search, these files import from @/components:
- `e:\learn-web3\apps\web\src\components\dashboard\PageHeadr.tsx`
- `e:\learn-web3\apps\web\src\components\dashboard\collections\collection-log-modal.tsx`
- `e:\learn-web3\apps\web\src\components\dashboard\collections\collections-client.tsx`
- `e:\learn-web3\apps\web\src\components\dashboard\dashboard-shell.tsx`
- `e:\learn-web3\apps\web\src\components\dashboard\kpi.tsx`
- `e:\learn-web3\apps\web\src\components\devices\device-actions-dropdown.tsx`
- `e:\learn-web3\apps\web\src\components\devices\issue-device-modal.tsx`
- `e:\learn-web3\apps\web\src\components\forms\collection-log-form.tsx`
- `e:\learn-web3\apps\web\src\components\price-books\price-book-modal.tsx`
- `e:\learn-web3\apps\web\src\components\tables\collectionsTable.tsx`
- `e:\learn-web3\apps\web\src\components\tables\data-table-filter-bar.tsx`
- `e:\learn-web3\apps\web\src\components\tables\farmersTable.tsx`
- `e:\learn-web3\apps\web\src\components\tables\filter-select.tsx`
- `e:\learn-web3\apps\web\src\components\tables\loansTable.tsx`
- `e:\learn-web3\apps\web\src\components\tables\pricebooksTable.tsx`
- `e:\learn-web3\apps\web\src\components\tables\table-shell.tsx`
- `e:\learn-web3\apps\web\src\components\tables\walletsTable.tsx`

## Rollback Plan
If issues arise:
1. Revert import changes in web app
2. Restore original component files
3. Remove components from UI package
4. Rebuild both packages

## Notes
- Always build UI package after changes: `cd packages/ui && npm run build`
- The UI package uses TypeScript, so type exports must be included
- Components should remain generic and app-agnostic
- App-specific logic (like useFilterParams) should stay in the web app
