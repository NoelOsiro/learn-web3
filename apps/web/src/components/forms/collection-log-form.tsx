// components/collections/collection-log-modal.tsx
'use client';

import { trpc } from '@/lib/trpc/client';
import { AlertCircle, FileText, Layers, X } from 'lucide-react'; // Fixed Layer -> Layers
import React, { useState } from 'react';

interface CollectionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchRowError {
  row: number;
  message: string;
}

export function CollectionLogModal({ isOpen, onClose, onSuccess }: CollectionLogModalProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC Queries
  const { data: farmersData } = trpc.farmerOps.list.useQuery({}, { enabled: isOpen });
  const { data: priceBooks } = trpc.priceBooks.active.useQuery(undefined, { enabled: isOpen });

  const farmers = farmersData?.data || [];

  // Single Form State
  const [singleForm, setSingleForm] = useState({
    farmerId: '',
    priceBookId: '',
    commodity: 'COFFEE',
    grade: 'GRADE_A',
    unit: 'KG',
    quantity: '',
    pricePerUnit: '',
    deductions: '0',
    notes: '',
  });

  // Batch Form State
  const [csvText, setCsvText] = useState('');
  const [batchErrors, setBatchErrors] = useState<BatchRowError[]>([]);

  // Mutations
  const createMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => setFormError(err.message),
  });

  const createBatchMutation = trpc.collections.createBatch.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => setFormError(err.message),
  });

  if (!isOpen) return null;

  // Price Book Auto-fill Handler (Safe Property Access)
  const handlePriceBookChange = (pbId: string) => {
    const selectedPb = priceBooks?.find((pb) => pb.id === pbId) as any;
    if (selectedPb) {
      setSingleForm((prev) => ({
        ...prev,
        priceBookId: pbId,
        commodity: selectedPb.commodity || prev.commodity,
        grade: selectedPb.grade || prev.grade,
        unit: selectedPb.unit || prev.unit,
        pricePerUnit: selectedPb.pricePerUnit
          ? String(selectedPb.pricePerUnit)
          : selectedPb.price
          ? String(selectedPb.price)
          : prev.pricePerUnit,
      }));
    } else {
      setSingleForm((prev) => ({ ...prev, priceBookId: pbId }));
    }
  };

  // Calculations
  const qty = parseFloat(singleForm.quantity) || 0;
  const rate = parseFloat(singleForm.pricePerUnit) || 0;
  const deduct = parseFloat(singleForm.deductions) || 0;
  const gross = qty * rate;
  const net = gross - deduct;

  // Single Submission Handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!singleForm.farmerId) {
      setFormError('Please select a farmer.');
      return;
    }
    if (qty <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (net < 0) {
      setFormError('Deductions cannot exceed total gross amount.');
      return;
    }

    createMutation.mutate({
      farmerId: singleForm.farmerId,
      priceBookId: singleForm.priceBookId || undefined,
      commodity: singleForm.commodity as any,
      grade: singleForm.grade as any,
      unit: singleForm.unit as any,
      quantity: qty,
      pricePerUnit: rate,
      deductions: deduct,
      notes: singleForm.notes || undefined,
    });
  };

  // CSV Batch Parsing and Validation
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setBatchErrors([]);

    const lines = csvText.trim().split('\n');
    if (lines.length === 0 || !csvText.trim()) {
      setFormError('Please paste valid CSV data.');
      return;
    }

    const parsedData: any[] = [];
    const errors: BatchRowError[] = [];

    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('farmerid')) return;
      if (!line.trim()) return;

      const [farmerId, commodity, grade, unit, quantity, pricePerUnit, deductions] = line
        .split(',')
        .map((s) => s.trim());

      const rowNum = index + 1;

      if (!farmerId) {
        errors.push({ row: rowNum, message: 'Missing Farmer ID' });
      }

      const q = parseFloat(quantity);
      const p = parseFloat(pricePerUnit);
      const d = parseFloat(deductions || '0');

      if (isNaN(q) || q <= 0) {
        errors.push({ row: rowNum, message: `Invalid Quantity: "${quantity}"` });
      }
      if (isNaN(p) || p < 0) {
        errors.push({ row: rowNum, message: `Invalid Price per Unit: "${pricePerUnit}"` });
      }

      if (errors.filter((e) => e.row === rowNum).length === 0) {
        parsedData.push({
          farmerId,
          commodity: (commodity || 'COFFEE').toUpperCase(),
          grade: (grade || 'GRADE_A').toUpperCase(),
          unit: (unit || 'KG').toUpperCase(),
          quantity: q,
          pricePerUnit: p,
          deductions: isNaN(d) ? 0 : d,
        });
      }
    });

    if (errors.length > 0) {
      setBatchErrors(errors);
      setFormError('Please fix the errors highlighted below before proceeding.');
      return;
    }

    if (parsedData.length === 0) {
      setFormError('No valid rows found to process.');
      return;
    }

    createBatchMutation.mutate(parsedData);
  };

  // Handle both React Query v4 (isLoading) and v5 (isPending)
  const isSingleSubmitting = createMutation.isPending ?? (createMutation as any).isLoading;
  const isBatchSubmitting = createBatchMutation.isPending ?? (createBatchMutation as any).isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Log Produce Intake</h2>
            <p className="text-xs text-muted-foreground">Record field collections and price valuations.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Toggle Switch */}
        <div className="mt-4 flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => { setMode('single'); setFormError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'single'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            Single Entry
          </button>
          <button
            type="button"
            onClick={() => { setMode('batch'); setFormError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'batch'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            Batch CSV Paste
          </button>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* SINGLE ENTRY FORM */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Farmer Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Select Farmer *
                </label>
                <select
                  value={singleForm.farmerId}
                  onChange={(e) => setSingleForm({ ...singleForm, farmerId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Farmer --</option>
                  {farmers?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Book Option */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Price Book (Auto-fill)
                </label>
                <select
                  value={singleForm.priceBookId}
                  onChange={(e) => handlePriceBookChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Custom Pricing --</option>
                  {priceBooks?.map((pb: any) => (
                    <option key={pb.id} value={pb.id}>
                      {pb.name} {pb.pricePerUnit ? `(KES ${pb.pricePerUnit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodity */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Commodity</label>
                <select
                  value={singleForm.commodity}
                  onChange={(e) => setSingleForm({ ...singleForm, commodity: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="COFFEE">Coffee</option>
                  <option value="TEA">Tea</option>
                  <option value="MACADAMIA">Macadamia</option>
                  <option value="AVOCADO">Avocado</option>
                  <option value="MILK">Milk</option>
                  <option value="MAIZE">Maize</option>
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Grade</label>
                <select
                  value={singleForm.grade}
                  onChange={(e) => setSingleForm({ ...singleForm, grade: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="GRADE_A">Grade A</option>
                  <option value="GRADE_B">Grade B</option>
                  <option value="GRADE_C">Grade C</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="STANDARD">Standard</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={singleForm.quantity}
                    onChange={(e) => setSingleForm({ ...singleForm, quantity: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <select
                    value={singleForm.unit}
                    onChange={(e) => setSingleForm({ ...singleForm, unit: e.target.value })}
                    className="rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="KG">KG</option>
                    <option value="LITRE">LITRE</option>
                    <option value="TONNE">TONNE</option>
                    <option value="BAG">BAG</option>
                    <option value="CRATE">CRATE</option>
                  </select>
                </div>
              </div>

              {/* Price Per Unit */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Rate / Unit (KES) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={singleForm.pricePerUnit}
                  onChange={(e) => setSingleForm({ ...singleForm, pricePerUnit: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Deductions / Fees (KES)
              </label>
              <input
                type="number"
                step="any"
                value={singleForm.deductions}
                onChange={(e) => setSingleForm({ ...singleForm, deductions: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Live Financial Calculation Box */}
            <div className="rounded-xl border border-border bg-muted/20 p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-muted-foreground">Gross Value: </span>
                <span className="font-semibold text-foreground">KES {gross.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Net Payout: </span>
                <span className="font-bold text-primary">KES {net.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSingleSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSingleSubmitting ? 'Saving...' : 'Save Collection'}
              </button>
            </div>
          </form>
        )}

        {/* BATCH CSV FORM */}
        {mode === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Paste CSV Data
              </label>
              <div className="text-[11px] text-muted-foreground mb-2 font-mono bg-muted/40 p-2 rounded-lg border border-border">
                Format: farmerId, commodity, grade, unit, quantity, pricePerUnit, deductions
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="uuid-farmer-1, COFFEE, GRADE_A, KG, 150, 85.5, 0&#10;uuid-farmer-2, TEA, PREMIUM, KG, 200, 45.0, 10"
                className="w-full font-mono text-xs rounded-lg border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Per-Row Error Feedback Box */}
            {batchErrors.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/10 p-3 space-y-1">
                <p className="text-xs font-semibold text-destructive">Batch Validation Errors:</p>
                {batchErrors.map((err, i) => (
                  <p key={i} className="text-[11px] text-destructive/90 font-mono">
                    Row {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}

            {/* Batch Action */}
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBatchSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isBatchSubmitting ? 'Processing Batch...' : 'Process Batch Intake'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}