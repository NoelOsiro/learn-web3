'use client';

// app/agent/bind/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import {
  generateEd25519KeyPair,
  storeKeyPair,
  deriveFingerprint,
  getDeviceInfo,
} from '@/lib/crypto/webcrypto';

type BindingStep = 'form' | 'generating' | 'binding' | 'success' | 'error';

export default function AgentBindPage() {
  const router = useRouter();
  const [step, setStep] = useState<BindingStep>('form');
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [algorithm, setAlgorithm] = useState('');

  const bindMutation = trpc.devices.bind.useMutation({
    onSuccess: async () => {
      setStep('success');
      toast.success('Device bound successfully');
    },
    onError: (error) => {
      setStep('error');
      setErrorMessage(error.message || 'Failed to bind device');
      toast.error(error.message || 'Failed to bind device');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pairing code format
    const formattedCode = pairingCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formattedCode.length !== 8) {
      toast.error('Pairing code must be exactly 8 characters');
      return;
    }

    // Check WebCrypto availability
    if (!crypto.subtle) {
      setStep('error');
      setErrorMessage('WebCrypto API not available. Please use HTTPS or a secure context.');
      return;
    }

    setStep('generating');

    try {
      // Generate Ed25519 keypair
      const keyPair = await generateEd25519KeyPair();
      setAlgorithm(keyPair.algorithm);

      // Derive fingerprint
      const fp = await deriveFingerprint(keyPair.publicKeyBase64);
      setFingerprint(fp);

      setStep('binding');

      // Call bind mutation
      bindMutation.mutate(
        {
          pairingCode: formattedCode,
          publicKey: keyPair.publicKeyBase64,
          deviceName: deviceName || getDeviceInfo(),
          platform: navigator.platform,
          appVersion: '1.0.0',
        },
        {
          onSuccess: async (result) => {
            // Store keypair in IndexedDB after successful binding
            await storeKeyPair(
              result.device.id,
              keyPair.publicKeyBase64,
              keyPair.privateKeyBase64,
              deviceName || getDeviceInfo()
            );
          },
        }
      );
    } catch (error) {
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate cryptographic keys');
      toast.error('Failed to generate cryptographic keys');
    }
  };

  const handlePairingCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Limit to 8 characters
    if (value.length > 8) value = value.slice(0, 8);
    // Add dash after 4 characters for display
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4);
    }
    setPairingCode(value);
  };

  const handleProceedToCollections = () => {
    router.push('/collections/new');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/20 dark:via-background dark:to-blue-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'form' && (
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-4">
                <Smartphone className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Pair This Device</h1>
              <p className="text-sm text-muted-foreground">
                Enter the 8-character pairing code provided by your cooperative administrator
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pairingCode" className="block text-sm font-medium text-foreground mb-2">
                  Pairing Code <span className="text-destructive">*</span>
                </label>
                <input
                  id="pairingCode"
                  type="text"
                  value={pairingCode}
                  onChange={handlePairingCodeChange}
                  placeholder="ABCD-1234"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
                  maxLength={9}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  Enter the 8-character code from your administrator
                </p>
              </div>

              <div>
                <label htmlFor="deviceName" className="block text-sm font-medium text-foreground mb-2">
                  Device Name (Optional)
                </label>
                <input
                  id="deviceName"
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder={getDeviceInfo()}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Leave blank to use auto-detected device info
                </p>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                Generate Keys & Bind Device
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text">
                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
                    Secure Cryptographic Binding
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs">
                    This will generate an Ed25519 keypair on your device. The private key is stored securely in your browser and never transmitted to the server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Generating Cryptographic Keys</h2>
              <p className="text-sm text-muted-foreground">
                Creating secure Ed25519 keypair for device binding...
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {step === 'binding' && (
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Binding Key to Account</h2>
              <p className="text-sm text-muted-foreground">
                Registering device with cooperative server...
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full" />
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Device Bound Successfully</h2>
              <p className="text-sm text-muted-foreground">
                Your device is now ready for offline collections
              </p>
            </div>

            {/* Device Info */}
            <div className="bg-muted rounded-lg p-4 space-y-3 text-left">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Device Fingerprint</p>
                <code className="text-sm font-mono text-foreground break-all">
                  {fingerprint.slice(0, 16)}...
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Cryptographic Algorithm</p>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  {algorithm} Keypair
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Key Storage</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  ✓ Stored securely in local browser storage
                </p>
              </div>
            </div>

            <button
              onClick={handleProceedToCollections}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Proceed to Offline Collections
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Binding Failed</h2>
              <p className="text-sm text-muted-foreground">
                {errorMessage || 'Invalid or expired pairing code. Contact your manager for a new pairing code.'}
              </p>
            </div>

            {errorMessage?.includes('HTTPS') && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>HTTPS Required:</strong> Cryptographic key generation requires a secure context (HTTPS). Please ensure you're accessing this page over a secure connection.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setStep('form');
                setErrorMessage('');
                setPairingCode('');
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
