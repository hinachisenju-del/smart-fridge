import { type FormEvent, useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { GroceryItem, QuantityActionType } from '../types/inventory';
import { ApiError } from '../api/inventoryApi';

interface QuantityModalProps {
  item: GroceryItem | null;
  mode: QuantityActionType | null;
  onClose: () => void;
  onConfirm: (id: number, action: QuantityActionType, amount: number) => Promise<void>;
}

const MODE_TITLES: Record<QuantityActionType, string> = {
  USE: 'Use Quantity',
  RESTOCK: 'Restock Item',
  CORRECT: 'Correct Exact Quantity',
  FINISH: 'Mark as Finished',
};

export function QuantityModal({
  item,
  mode,
  onClose,
  onConfirm,
}: QuantityModalProps) {
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item || !mode) return;
    setError(null);
    if (mode === 'CORRECT') {
      setAmount(String(item.quantity));
    } else if (mode === 'USE') {
      setAmount(String(Math.min(1, item.quantity || 1)));
    } else {
      setAmount('1');
    }
  }, [item, mode]);

  if (!item || !mode) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = Number(amount);
    if (Number.isNaN(parsed)) {
      setError('Please enter a valid number.');
      return;
    }
    if (mode === 'USE') {
      if (parsed <= 0) {
        setError('Use amount must be greater than zero.');
        return;
      }
      if (parsed > item.quantity) {
        setError(
          `Cannot use ${parsed} ${item.unit} — only ${item.quantity} ${item.unit} available.`
        );
        return;
      }
    }
    if (mode === 'RESTOCK' && parsed <= 0) {
      setError('Restock amount must be greater than zero.');
      return;
    }
    if (mode === 'CORRECT' && parsed < 0) {
      setError('Corrected quantity cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(item.id, mode, parsed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update quantity. Please check backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="quantity-adjustment-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-[14px] bg-surface-primary border border-border-default text-text-primary shadow-popover overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-surface-page border-b border-border-default">
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">{MODE_TITLES[mode]}</h2>
            <p className="text-[12px] text-text-secondary">
              {item.productName} &middot; Current: {item.quantity} {item.unit}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {error && (
            <div
              data-testid="quantity-modal-error"
              className="flex items-start gap-2 p-3 rounded-[6px] bg-danger-subtle border border-red-200 text-danger-primary text-[13px] font-medium"
            >
              <AlertCircle className="w-4 h-4 text-danger-primary shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {mode === 'CORRECT'
                ? `New Total Quantity (${item.unit})`
                : mode === 'USE'
                  ? `Quantity to Use (${item.unit})`
                  : `Quantity to Add (${item.unit})`} <span className="text-danger-primary">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              data-testid="quantity-modal-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] px-4 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[14px] font-semibold text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="quantity-modal-submit"
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover active:bg-surface-inverse disabled:opacity-50 text-brand-text text-[14px] font-semibold shadow-card transition-colors cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
