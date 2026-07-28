import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
      {/* Title & Description Column */}
      <div className="space-y-1">
        {subtitle && (
          <p className="text-xs font-bold text-primary tracking-[0.14em] uppercase mb-1.5">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl sm:text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Slot */}
      {children && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
