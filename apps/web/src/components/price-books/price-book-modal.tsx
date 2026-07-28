'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CommodityType } from '@cashflow/database';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Modal } from '@/components/dashboard/collections/collection-log-modal';

interface PriceBookLine {
  id?: string;
  grade: string;
  unit: string;
  pricePerUnit: string;
  currency: string;
}

interface PriceBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    name: string;
    commodity: CommodityType;
    isDefault: boolean;
    validFrom: string;
    validTo: string | null;
    lines: PriceBookLine[];
  };
}

const COMMODITY_OPTIONS = [
  { value: 'MILK', label: 'Milk' },
  { value: 'MAIZE', label: 'Maize' },
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'AVOCADO', label: 'Avocado' },
  { value: 'MACADAMIA', label: 'Macadamia' },
  { value: 'TEA', label: 'Tea' },
];

const GRADE_OPTIONS = [
  { value: 'GRADE_A', label: 'Grade A' },
  { value: 'GRADE_B', label: 'Grade B' },
  { value: 'GRADE_C', label: 'Grade C' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'REJECT', label: 'Reject' },
];

const UNIT_OPTIONS = [
  { value: 'KG', label: 'Kilograms (KG)' },
  { value: 'LITRE', label: 'Litres (L)' },
  { value: 'TONNE', label: 'Tonne' },
  { value: 'BAG', label: 'Bag' },
  { value: 'CRATE', label: 'Crate' },
  { value: 'UNIT', label: 'Unit' },
];

export function PriceBookModal({ isOpen, onClose, onSuccess, editData }: PriceBookModalProps) {
  const [name, setName] = useState('');
  const [commodity, setCommodity] = useState<CommodityType>('MILK');
  const [isDefault, setIsDefault] = useState(false);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [lines, setLines] = useState<PriceBookLine[]>([]);

  const createMutation = trpc.priceBooks.create.useMutation({
    onSuccess: () => {
      toast.success('Price book created successfully');
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create price book');
    },
  });

  const updateMutation = trpc.priceBooks.update.useMutation({
    onSuccess: () => {
      toast.success('Price book updated successfully');
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update price book');
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setName(editData.name);
        setCommodity(editData.commodity);
        setIsDefault(editData.isDefault);
        setValidFrom(editData.validFrom.split('T')[0]);
        setValidTo(editData.validTo ? editData.validTo.split('T')[0] : '');
        setLines(editData.lines);
      } else {
        setName('');
        setCommodity('MILK');
        setIsDefault(false);
        setValidFrom(new Date().toISOString().split('T')[0]);
        setValidTo('');
        setLines([
          { grade: 'GRADE_A', unit: 'KG', pricePerUnit: '', currency: 'KES' },
        ]);
      }
    }
  }, [isOpen, editData]);

  const addLine = () => {
    setLines([...lines, { grade: 'GRADE_A', unit: 'KG', pricePerUnit: '', currency: 'KES' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    } else {
      toast.error('At least one price line is required');
    }
  };

  const updateLine = (index: number, field: keyof PriceBookLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const validateLines = (): boolean => {
    // Check for duplicate grade/unit combinations
    const combinations = lines.map((line) => `${line.grade}-${line.unit}`);
    const uniqueCombinations = new Set(combinations);
    
    if (combinations.length !== uniqueCombinations.size) {
      toast.error('Duplicate grade/unit combination detected. Each grade/unit pair must be unique.');
      return false;
    }

    // Check all lines have required fields
    for (const line of lines) {
      if (!line.grade || !line.unit || !line.pricePerUnit) {
        toast.error('Please fill in all required fields for each price line');
        return false;
      }
      const price = parseFloat(line.pricePerUnit);
      if (isNaN(price) || price <= 0) {
        toast.error('Price per unit must be a positive number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Price book name is required');
      return;
    }

    if (!validFrom) {
      toast.error('Valid from date is required');
      return;
    }

    if (!validateLines()) {
      return;
    }

    const payload = {
      name: name.trim(),
      commodity,
      isDefault,
      validFrom: new Date(validFrom),
      validTo: validTo ? new Date(validTo) : undefined,
      lines: lines.map((line) => ({
        ...line,
        pricePerUnit: line.pricePerUnit,
      })),
    };

    if (editData) {
      updateMutation.mutate({ id: editData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClose = () => {
    setName('');
    setCommodity('MILK');
    setIsDefault(false);
    setValidFrom('');
    setValidTo('');
    setLines([]);
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? 'Edit Price Book' : 'Create Price Book'}
      description={editData ? 'Update pricing matrix and validity period' : 'Configure commodity rates and grade-level pricing'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Price Book Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2024 Milk Pricing"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="commodity" className="block text-sm font-medium text-foreground mb-2">
              Commodity Type <span className="text-destructive">*</span>
            </label>
            <select
              id="commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value as CommodityType)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            >
              {COMMODITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="isDefault" className="block text-sm font-medium text-foreground mb-2">
              Mark as Default
            </label>
            <div className="flex items-center gap-3 h-[42px]">
              <input
                id="isDefault"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground">
                Set as active catalog for this commodity
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="validFrom" className="block text-sm font-medium text-foreground mb-2">
              Valid From <span className="text-destructive">*</span>
            </label>
            <input
              id="validFrom"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="validTo" className="block text-sm font-medium text-foreground mb-2">
              Valid To <span className="text-muted-foreground">(Optional)</span>
            </label>
            <input
              id="validTo"
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              min={validFrom}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Grade Pricing Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Grade Pricing Matrix</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Grade Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Grade
                  </label>
                  <select
                    value={line.grade}
                    onChange={(e) => updateLine(index, 'grade', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {GRADE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Unit
                  </label>
                  <select
                    value={line.unit}
                    onChange={(e) => updateLine(index, 'unit', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Price/Unit (KES)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={line.pricePerUnit}
                    onChange={(e) => updateLine(index, 'pricePerUnit', e.target.value)}
                    placeholder="0.0000"
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={line.currency}
                    disabled
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="mt-5 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Each grade/unit combination must be unique. Prices are stored with 4 decimal precision.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Saving...' : editData ? 'Update Price Book' : 'Create Price Book'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
