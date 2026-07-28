import { Search, X } from "lucide-react";
import { ReactNode } from "react";

export interface FilterToolbarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
}

export function FilterToolbar({
  placeholder = "Search...",
  value,
  onChange,
  children,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">

      <div className="relative w-full lg:max-w-md">

        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {value && (
          <button
            onClick={() => onChange?.("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function TableShell({ children, summary }: { children: React.ReactNode; summary?: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="overflow-x-auto">{children}</div>{summary && <div className="border-t border-border bg-muted/40 px-5 py-3">{summary}</div>}</div>;
}
