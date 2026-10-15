import { type FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  EXPIRY_SOURCE_LABELS,
  STORAGE_LOCATION_LABELS,
  type ConvertPurchasedPayload,
  type ExpirySource,
  type ShoppingListItem,
  type StorageLocation,
} from '../types/inventory';

interface ConvertPurchasedModalProps {
  item: ShoppingListItem | null;
  onClose: () => void;
  onConfirm: (shoppingItemId: number, payload: ConvertPurchasedPayload) => Promise<void>;
}

const STORAGE_LOCATIONS = Object.keys(STORAGE_LOCATION_LABELS) as StorageLocation[];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultExpiryIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function ConvertPurchasedModal({
  item,
  onClose,
  onConfirm,
}: ConvertPurchasedModalProps) {
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('UPPER_SHELF');
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [expiryDate, setExpiryDate] = useState(defaultExpiryIso());
  const [expirySource, setExpirySource] = useState<ExpirySource>('ESTIMATED');
  const [minimumStockThreshold, setMinimumStockThreshold] = useState('1');
  const [notes, setNotes] = useState('');
  const [removeFromShoppingList, setRemoveFromShoppingList] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setStorageLocation('UPPER_SHELF');
    setPurchaseDate(todayIso());
    setExpiryDate(defaultExpiryIso());
    setExpirySource('ESTIMATED');
    setMinimumStockThreshold('1');
    setNotes(item.notes ?? '');
    setRemoveFromShoppingList(true);
    setErrorMessage(null);
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedThreshold = Number(minimumStockThreshold);
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMessage('Minimum stock threshold cannot be negative.');
      return;
    }

    const payload: ConvertPurchasedPayload = {
      storageLocation,
      purchaseDate,
      expiryDate: expiryDate.trim() ? expiryDate.trim() : null,
      expirySource: expiryDate.trim() ? expirySource : null,
      minimumStockThreshold: parsedThreshold,
      notes: notes.trim() ? notes.trim() : null,
      removeFromShoppingList,
    };

    setSubmitting(true);
    try {
      await onConfirm(item.id, payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to add purchased item to pantry inventory.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-modal-title"
      className="fixed inset-0 z-50 bg-surface-inverse/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-surface-primary rounded-[14px] border border-border-default max-w-lg w-full p-6 shadow-popover space-y-5 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[6px] bg-surface-secondary text-success-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="convert-modal-title" className="text-[16px] font-semibold text-text-primary">
                Restock to Pantry
              </h2>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Restock your household pantry inventory with purchased groceries.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="rounded-[8px] border border-border-default bg-surface-secondary p-3.5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-success-primary">
            Purchased Item
          </p>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-[14px] text-text-primary">{item.name}</span>
            <span className="text-[14px] font-bold text-text-primary">
              +{item.quantity} {item.unit}
            </span>
          </div>
          {item.estimatedPrice != null && (
            <p className="text-[12px] text-text-secondary">
              Estimated purchase cost: ₹{(item.estimatedPrice * item.quantity).toFixed(2)}
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-[6px] border border-red-200 bg-danger-subtle p-3 text-[13px] text-danger-primary font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Storage Location */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Storage Compartment <span className="text-danger-primary">*</span>
            </label>
            <select
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            >
              {STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {STORAGE_LOCATION_LABELS[loc]}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Expiry Date (optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Expiry Date Source
              </label>
              <select
                disabled={!expiryDate.trim()}
                value={expirySource}
                onChange={(e) => setExpirySource(e.target.value as ExpirySource)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
              >
                {(['CONFIRMED', 'ESTIMATED'] as ExpirySource[]).map((src) => (
                  <option key={src} value={src}>
                    {EXPIRY_SOURCE_LABELS[src]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Date & Min Stock Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Purchase Date <span className="text-danger-primary">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Min Stock Alert Level
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minimumStockThreshold}
                onChange={(e) => setMinimumStockThreshold(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Remove from Shopping List checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={removeFromShoppingList}
                onChange={(e) => setRemoveFromShoppingList(e.target.checked)}
                className="w-4 h-4 rounded-[4px] border-border-default text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-[13px] font-medium text-text-primary">
                Remove from shopping list after restocking to pantry
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[14px] font-semibold text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover active:bg-surface-inverse text-brand-text text-[14px] font-semibold shadow-card transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Restocking...' : 'Confirm & Restock to Pantry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
