'use client';

// components/devices/issue-device-modal.tsx
import { useState } from 'react';
import { X, Copy, Smartphone, Clock, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

interface IssueDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IssueDeviceModal({ isOpen, onClose, onSuccess }: IssueDeviceModalProps) {
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [deviceName, setDeviceName] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  const issueMutation = trpc.devices.issue.useMutation({
    onSuccess: (data) => {
      setPairingCode(data.pairingCode);
      setExpiresAt(new Date(data.expiresAt));
      setStep('code');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to issue device code');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      toast.error('Device name is required');
      return;
    }
    issueMutation.mutate({
      name: deviceName.trim(),
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    toast.success('Pairing code copied to clipboard');
  };

  const handleClose = () => {
    setStep('form');
    setDeviceName('');
    setPairingCode('');
    setExpiresAt(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {step === 'form' ? 'Issue New Device Code' : 'Pairing Code Generated'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="deviceName" className="block text-sm font-medium text-foreground mb-2">
                  Device Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="deviceName"
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Field Agent Tablet - Nyeri"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  A descriptive name for this device (e.g., agent name + location)
                </p>
              </div>

              <div>
                <label htmlFor="assignedAgent" className="block text-sm font-medium text-foreground mb-2">
                  Assigned Field Agent (Optional)
                </label>
                <select
                  id="assignedAgent"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select an agent...</option>
                  <option value="1">David Ochieng</option>
                  <option value="2">Sarah Hassan</option>
                </select>
              </div>

              <div>
                <label htmlFor="collectionCenter" className="block text-sm font-medium text-foreground mb-2">
                  Collection Center (Optional)
                </label>
                <select
                  id="collectionCenter"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select a center...</option>
                  <option value="1">Nyeri Central</option>
                  <option value="2">Murang'a Zone 2</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {issueMutation.isPending ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Pairing Code Display */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Device Code Ready
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share this code with the field agent during app onboarding
                </p>
              </div>

              {/* Large Code Display */}
              <div className="bg-muted rounded-xl p-6 text-center space-y-3">
                <div className="text-4xl font-mono font-bold tracking-widest text-foreground uppercase">
                  {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </button>
              </div>

              {/* Expiry Timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {expiresAt && (
                  <span>Expires in {Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))} hours</span>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Instructions for Field Agent
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Open the mobile app, navigate to device binding, and enter this 8-character code to complete the setup.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
