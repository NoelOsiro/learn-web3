export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 h-16 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20" />
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="hidden sm:flex h-6 w-36 rounded-full bg-muted items-center px-2.5 gap-1.5">
              <div className="h-3.5 w-3.5 rounded-full bg-primary/30" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="hidden sm:block text-right">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded mt-1" />
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/20" />
            <div className="hidden md:block h-9 w-20 rounded-lg bg-muted" />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 shrink-0 border-r border-border/80 px-3 py-5 lg:block">
          <div className="mb-5 h-3 w-20 rounded bg-muted" />
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="mb-2 h-10 rounded-xl bg-muted/70" />
          ))}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3.5 w-24 bg-muted rounded" />
          <div className="h-8 w-56 bg-muted rounded-lg" />
          <div className="h-4 w-80 bg-muted rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-muted rounded-lg" />
          <div className="h-10 w-36 bg-primary/20 rounded-lg" />
        </div>
      </div>

      {/* Summary KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded-full" />
            </div>
            <div className="h-8 w-36 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Filters Toolbar Skeleton */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="h-9 w-full md:w-80 bg-muted rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-muted rounded-lg" />
          <div className="h-9 w-32 bg-muted rounded-lg" />
          <div className="h-9 w-32 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 bg-secondary/50 border-b border-border flex justify-between gap-4">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 w-24">
                <div className="h-4 w-full bg-muted rounded" />
              </div>
              <div className="space-y-1.5 w-32">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="space-y-1.5 w-24">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
              <div className="space-y-1.5 w-28 text-right">
                <div className="h-4 w-24 bg-muted rounded ml-auto" />
                <div className="h-3 w-16 bg-muted rounded ml-auto" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-4 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div></main></div></div>
  );
}
