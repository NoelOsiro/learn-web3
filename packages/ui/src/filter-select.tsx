import { ChevronDown } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  className = '',
}: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-background border border-border px-3 py-2 pr-8 rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
