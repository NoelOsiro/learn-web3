'use client';

// app/dashboard/devices/page.tsx
import { useState } from 'react';
import {
  Smartphone,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Copy,
  Ban,
  KeyRound,
} from 'lucide-react';
import { PageHeader, KPI } from '@cashflow/ui';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { IssueDeviceModal } from '@/components/devices/issue-device-modal';
import { DeviceActionsDropdown } from '@/components/devices/device-actions-dropdown';

type DeviceStatus = 'bound' | 'pending' | 'expired' | 'inactive';

export default function DevicesPage() {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  
  const { data: devicesData, isLoading, refetch } = trpc.devices.list.useQuery();

  const devices = devicesData?.devices || [];

  // Calculate KPIs
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.bindingStatus === 'bound').length;
  const pendingDevices = devices.filter(d => d.bindingStatus === 'pending').length;
  const inactiveDevices = devices.filter(d => d.bindingStatus === 'inactive' || d.bindingStatus === 'expired').length;

  const kpis = [
    {
      label: 'Total Devices',
      value: totalDevices.toString(),
      sub: 'Registered in system',
      accent: 'hsl(var(--agri-leaf))',
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      label: 'Active Field Devices',
      value: activeDevices.toString(),
      sub: 'Currently bound & operational',
      accent: 'hsl(var(--agri-lime))',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: 'Pending Pairings',
      value: pendingDevices.toString(),
      sub: 'Awaiting agent binding',
      accent: 'hsl(var(--agri-harvest))',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: 'Revoked / Inactive',
      value: inactiveDevices.toString(),
      sub: 'Deactivated or expired',
      accent: 'hsl(var(--destructive))',
      icon: <Ban className="h-4 w-4" />,
    },
  ];

  const handleIssueSuccess = () => {
    refetch();
    toast.success('Device pairing code issued successfully');
  };


  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        subtitle="Device Management"
        title="Field Devices & Pairing"
        description="Manage registered agent mobile devices, issue single-use pairing codes, and monitor hardware security."
      >
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Issue New Device
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <KPI kpis={kpis} />

      {/* Devices Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No devices registered</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Issue your first device pairing code to get started
            </p>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
            >
              <Plus className="h-4 w-4" />
              Issue First Device
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Device Name</th>
                  <th className="px-6 py-3.5">Assigned Agent / Center</th>
                  <th className="px-6 py-3.5">Fingerprint</th>
                  <th className="px-6 py-3.5">Key Version</th>
                  <th className="px-6 py-3.5">Last Seen</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{device.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ID: {device.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {device.CollectionCenter ? (
                        <div>
                          <div className="font-medium text-foreground">{device.CollectionCenter.name}</div>
                          <div className="text-xs text-muted-foreground">{device.CollectionCenter.code}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {device.bindingStatus === 'bound' 
                            ? device.id.slice(0, 12) + '...'
                            : 'Pending...'}
                        </code>
                        {device.bindingStatus === 'bound' && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(device.id);
                              toast.success('Fingerprint copied');
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        v1 (Ed25519)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {device.last_seen_at 
                        ? formatRelativeTime(new Date(device.last_seen_at))
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <DeviceStatusBadge status={device.bindingStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeviceActionsDropdown
                        device={device}
                        onRefresh={refetch}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Device Modal */}
      <IssueDeviceModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleIssueSuccess}
      />
    </div>
  );
}

function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  switch (status) {
    case 'bound':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Active
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" /> Pending Pairing
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          <AlertCircle className="h-3 w-3" /> Expired
        </span>
      );
    case 'inactive':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <Ban className="h-3 w-3" /> Revoked
        </span>
      );
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
