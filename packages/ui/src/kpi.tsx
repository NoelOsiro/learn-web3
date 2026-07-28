export interface KPI {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}

export function KPI({ kpis }: { kpis: KPI[] }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {kpis.map((kpi) => (
      <div
        key={kpi.label}
        className="relative rounded-xl p-5 border overflow-hidden"
        style={{ borderLeftWidth: '3px', borderLeftColor: kpi.accent }}
      >
        <div
          className="mb-3 flex items-center justify-between text-muted-foreground"
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {kpi.label}
          </span>
          <span style={{ color: kpi.accent }}>{kpi.icon}</span>
        </div>
        <p
          className="text-xl font-bold leading-tight text-foreground"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
        >
          {kpi.value}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {kpi.sub}
        </p>
      </div>
    ))}
  </div>;
}
