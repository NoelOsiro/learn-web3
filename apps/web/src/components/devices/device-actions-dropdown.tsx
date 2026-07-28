'use client';

// components/devices/device-actions-dropdown.tsx
import { useState } from 'react';
import { MoreVertical, RefreshCw, Ban, ShieldAlert, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

type DeviceStatus = 'bound' | 'pending' | 'expired' | 'inactive';

interface Device {
  id: string;
  name: string;
  center_id: string | null;
  user_id: string | null;
  is_active: boolean;
  bound_at: string | null;
  last_seen_at: string | null;
  pairing_expires_at: string | null;
  created_at: string;
  bindingStatus: DeviceStatus;
  CollectionCenter?: {
    name: string;
    code: string;
  } | null;
}

interface DeviceActionsDropdownProps {
  device: Device;
  onRefresh: () => void;
}

export function DeviceActionsDropdown({ device, onRefresh }: DeviceActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const deactivateMutation = trpc.devices.deactivate.useMutation({
    onSuccess: () => {
      onRefresh();
      toast.success('Device deactivated successfully');
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate device');
    },
  });

  const reactivateMutation = trpc.devices.reactivate.useMutation({
    onSuccess: () => {
      onRefresh();
      toast.success('Device reactivated successfully');
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reactivate device');
    },
  });

  const handleDeactivate = () => {
    if (confirm(`Are you sure you want to deactivate "${device.name}"? This will immediately revoke its access.`)) {
      deactivateMutation.mutate({ deviceId: device.id });
    }
  };

  const handleReactivate = () => {
    reactivateMutation.mutate({ deviceId: device.id });
  };

  const handleReissueCode = () => {
    // This would open a modal to reissue a new pairing code
    toast.info('Re-issue pairing code feature - implement modal');
    setIsOpen(false);
  };

  const canReissue = device.bindingStatus === 'pending' || device.bindingStatus === 'expired';
  const canDeactivate = device.bindingStatus === 'bound';
  const canReactivate = device.bindingStatus === 'inactive';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="py-1">
              {canReissue && (
                <button
                  onClick={handleReissueCode}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-issue Pairing Code
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              )}
              
              {canDeactivate && (
                <button
                  onClick={handleDeactivate}
                  disabled={deactivateMutation.isPending}
                  className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ban className="h-4 w-4" />
                  Deactivate Device
                </button>
              )}

              {canReactivate && (
                <button
                  onClick={handleReactivate}
                  disabled={reactivateMutation.isPending}
                  className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Reactivate Device
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
