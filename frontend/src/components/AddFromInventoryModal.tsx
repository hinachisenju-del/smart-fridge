import { type FormEvent, useEffect, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import {
  SHOPPING_PRIORITY_LABELS,
  type GroceryItem,
  type LowStockSuggestion,
  type ShoppingItemPriority,
} from '../types/inventory';

interface AddFromInventoryModalProps {
  groceryItem: GroceryItem | LowStockSuggestion | null;
  onClose: () => void;
  onConfirm: (inventoryItemId: number, quantityToBuy: number, priority: ShoppingItemPriority) => Promise<void>;
}

const PRIORITIES: ShoppingItemPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export function AddFromInventoryModal({
  groceryItem,
  onClose,
  onConfirm,
}: AddFromInventoryModalProps) {
  const [quantityToBuy, setQuantityToBuy] = useState('1');
  const [priority, setPriority] = useState<ShoppingItemPriority>('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!groceryItem) return;
    setErrorMessage(null);

    // Calculate suggested restock amount
    let initialQty = 1;
    if ('suggestedQuantity' in groceryItem && groceryItem.suggestedQuantity) {
      initialQty = groceryItem.suggestedQuantity;
    } else if ('quantity' in groceryItem && 'minimumStockThreshold' in groceryItem) {
      const deficit = groceryItem.minimumStockThreshold - groceryItem.quantity;
      initialQty = Math.max(1, deficit <= 0 ? 1 : Math.ceil(deficit));
    }
    setQuantityToBuy(String(initialQty));
    setPriority('HIGH');
  }, [groceryItem]);

  if (!groceryItem) return null;

  const itemName = 'productName' in groceryItem ? groceryItem.productName : groceryItem.name;
  const currentQty = 'quantity' in groceryItem ? groceryItem.quantity : groceryItem.currentQuantity;
  const minThreshold = groceryItem.minimumStockThreshold;
  const unit = groceryItem.unit;
  const itemId = 'id' in groceryItem ? groceryItem.id : groceryItem.inventoryItemId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedQty = Number(quantityToBuy);
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('Quantity to buy must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(itemId, parsedQty, priority);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to add item to shopping list.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-from-inv-title"
      className="fixed inset-0 z-50 bg-surface-inverse/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-surface-primary rounded-[14px] border border-border-default max-w-md w-full p-6 shadow-popover space-y-5 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[6px] bg-surface-secondary text-success-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-from-inv-title" className="text-[16px] font-semibold text-text-primary">
                Restock via Shopping List
              </h2>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Queue grocery item to your shopping list with a target buy quantity.
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

        {/* Current Fridge Stock Overview */}
        <div className="rounded-[8px] border border-amber-200 bg-warning-subtle p-3.5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-warning-primary">
            Current Inventory Status
          </p>
          <p className="font-semibold text-[14px] text-text-primary">{itemName}</p>
          <p className="text-[12px] text-warning-primary">
            Have {currentQty} {unit} &middot; Min stock alert at {minThreshold} {unit}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-[6px] border border-red-200 bg-danger-subtle p-3 text-[13px] text-danger-primary font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Quantity to Buy ({unit}) <span className="text-danger-primary">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={quantityToBuy}
              onChange={(e) => setQuantityToBuy(e.target.value)}
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Shopping Priority <span className="text-danger-primary">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ShoppingItemPriority)}
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {SHOPPING_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
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
              {submitting ? 'Adding...' : 'Add to Shopping List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
