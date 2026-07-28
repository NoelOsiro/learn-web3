import { PageHeader } from '@cashflow/ui';
import { Bell, Building2, Check, Globe2, ShieldCheck, SlidersHorizontal } from 'lucide-react';


const settings = [
  { icon: Building2, title: 'Cooperative profile', description: 'Branding, legal details, collection centers and contact information.', action: 'Edit profile' },
  { icon: Globe2, title: 'Regional preferences', description: 'Currency, timezone, language and date formats for financial records.', action: 'Manage preferences' },
  { icon: SlidersHorizontal, title: 'Produce workflow', description: 'Collection approval gates, pricing rules and payout thresholds.', action: 'Configure workflow' },
  { icon: ShieldCheck, title: 'Security & compliance', description: 'Authentication, session controls and administrative audit settings.', action: 'Review security' },
];

export default function SettingsPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      <PageHeader
        subtitle="Platform controls"
        title="Workspace settings"
        description="Set up how your cooperative captures, approves, and pays for produce."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map(({ icon: Icon, title, description, action }) => (
          <section
            key={title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/35"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-bold">{title}</h2>
            <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            <button className="mt-5 text-sm font-semibold text-primary hover:underline">
              {action}
            </button>
          </section>
        ))}
      </div>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-agri-harvest/15 text-agri-harvest">
            <Bell className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-bold">Operational notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send alerts for pending quality checks, payout failures, and new credit
              applications.
            </p>
            <div className="mt-5 divide-y divide-border rounded-xl border border-border">
              {['Daily collection digest', 'Payout exception alerts', 'Credit approval updates'].map(
                (label) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Check className="h-3 w-3" /> Enabled
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
