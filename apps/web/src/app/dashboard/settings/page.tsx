'use client';

import { PageHeader } from '@cashflow/ui';
import { Bell, Building2, Check, Globe2, ShieldCheck, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface SettingsCard {
  icon: any;
  title: string;
  description: string;
  action: string;
  priority: 'critical' | 'routine';
}

const settingsCards: SettingsCard[] = [
  {
    icon: SlidersHorizontal,
    title: 'Produce workflow',
    description: 'Collection approval gates, pricing rules and payout thresholds.',
    action: 'Configure workflow',
    priority: 'critical',
  },
  {
    icon: ShieldCheck,
    title: 'Security & compliance',
    description: 'Authentication, session controls and administrative audit settings.',
    action: 'Review security',
    priority: 'critical',
  },
  {
    icon: Building2,
    title: 'Cooperative profile',
    description: 'Branding, legal details, collection centers and contact information.',
    action: 'Edit profile',
    priority: 'routine',
  },
  {
    icon: Globe2,
    title: 'Regional preferences',
    description: 'Currency, timezone, language and date formats for financial records.',
    action: 'Manage preferences',
    priority: 'routine',
  },
];

const defaultNotifications: NotificationSetting[] = [
  {
    id: 'daily-digest',
    label: 'Daily collection digest',
    description: 'Summary of all produce collections and quality checks',
    enabled: true,
  },
  {
    id: 'payout-alerts',
    label: 'Payout exception alerts',
    description: 'Failed transactions and payment processing issues',
    enabled: true,
  },
  {
    id: 'credit-updates',
    label: 'Credit approval updates',
    description: 'New credit applications and approval status changes',
    enabled: true,
  },
];

function ToggleSwitch({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`Toggle ${label}`}
      onClick={onToggle}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${enabled ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

function SettingsCard({ icon: Icon, title, description, action, priority }: SettingsCard) {
  const isCritical = priority === 'critical';
  
  return (
    <section
      className={`
        rounded-2xl border bg-card p-5 shadow-sm transition-all
        ${isCritical 
          ? 'border-agri-harvest/30 bg-gradient-to-br from-agri-harvest/5 to-transparent hover:border-agri-harvest/50 hover:shadow-md' 
          : 'border-border hover:border-primary/35'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <span className={`
          grid h-12 w-12 place-items-center rounded-xl
          ${isCritical 
            ? 'bg-agri-harvest/15 text-agri-harvest' 
            : 'bg-primary/10 text-primary'
          }
        `}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base">{title}</h2>
            {isCritical && (
              <span className="inline-flex items-center gap-1 rounded-full bg-agri-harvest/10 px-2 py-0.5 text-xs font-semibold text-agri-harvest">
                <AlertTriangle className="h-3 w-3" />
                Critical
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <button className="mt-4 text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
            {action} →
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>(defaultNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <PageHeader
          subtitle="Platform controls"
          title="Workspace settings"
          description="Set up how your cooperative captures, approves, and pays for produce."
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      <PageHeader
        subtitle="Platform controls"
        title="Workspace settings"
        description="Set up how your cooperative captures, approves, and pays for produce."
      />
      
      {/* Critical Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-agri-harvest" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Critical Settings
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {settingsCards.filter(card => card.priority === 'critical').map(card => (
            <SettingsCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Routine Settings Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          General Settings
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {settingsCards.filter(card => card.priority === 'routine').map(card => (
            <SettingsCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-agri-harvest/15 text-agri-harvest">
            <Bell className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Operational notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send alerts for pending quality checks, payout failures, and new credit applications.
            </p>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No notification settings configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(({ id, label, description, enabled }) => (
              <div
                key={id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    {enabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
                <ToggleSwitch
                  enabled={enabled}
                  onToggle={() => handleToggle(id)}
                  label={label}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
