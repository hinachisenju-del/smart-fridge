import { type FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  SHOPPING_PRIORITY_LABELS,
  type Category,
  type ShoppingItemPriority,
  type ShoppingList,
  type ShoppingListItem,
  type ShoppingListItemPayload,
} from '../types/inventory';

interface ShoppingItemModalProps {
  isOpen: boolean;
  initialItem: ShoppingListItem | null;
  lists?: ShoppingList[];
  activeListId?: number | null;
  onClose: () => void;
  onSubmit: (payload: ShoppingListItemPayload, editId?: number) => Promise<void>;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const PRIORITIES: ShoppingItemPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export function ShoppingItemModal({
  isOpen,
  initialItem,
  lists = [],
  activeListId,
  onClose,
  onSubmit,
}: ShoppingItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('DAIRY');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priority, setPriority] = useState<ShoppingItemPriority>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [selectedListId, setSelectedListId] = useState<number | undefined>(() => activeListId ?? undefined);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setQuantity(String(initialItem.quantity));
      setUnit(initialItem.unit);
      setEstimatedPrice(
        initialItem.estimatedPrice != null ? String(initialItem.estimatedPrice) : ''
      );
      setPriority(initialItem.priority);
      setNotes(initialItem.notes ?? '');
      setSelectedListId(initialItem.shoppingListId);
    } else {
      setName('');
      setCategory('DAIRY');
      setQuantity('1');
      setUnit('pcs');
      setEstimatedPrice('');
      setPriority('MEDIUM');
      setNotes('');
      setSelectedListId(activeListId ?? undefined);
    }
  }, [isOpen, initialItem, activeListId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    const parsedQty = Number(quantity);
    const parsedPrice = estimatedPrice.trim() === '' ? null : Number(estimatedPrice);

    if (!trimmedName) {
      setErrorMessage('Item name is required.');
      return;
    }
    if (!trimmedUnit) {
      setErrorMessage('Unit is required.');
      return;
    }
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }
    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      setErrorMessage('Estimated price cannot be negative.');
      return;
    }

    const payload: ShoppingListItemPayload = {
      name: trimmedName,
      category,
      quantity: parsedQty,
      unit: trimmedUnit,
      estimatedPrice: parsedPrice,
      priority,
      notes: notes.trim() ? notes.trim() : null,
      inventoryItemId: initialItem?.inventoryItemId ?? null,
      shoppingListId: selectedListId,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload, initialItem?.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save shopping list item.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-modal-title"
      className="fixed inset-0 z-50 bg-surface-inverse/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-surface-primary rounded-[14px] border border-border-default max-w-lg w-full p-6 shadow-popover space-y-5 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div>
            <h2 id="shopping-modal-title" className="text-[16px] font-semibold text-text-primary">
              {initialItem ? 'Edit Shopping Item' : 'Add to Shopping List'}
            </h2>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Keep your household stocked by tracking what you need to purchase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-[6px] border border-red-200 bg-danger-subtle p-3 text-[13px] text-danger-primary font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target List Selection (if multiple lists exist) */}
          {lists.length > 0 && (
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Shopping List
              </label>
              <select
                value={selectedListId ?? ''}
                onChange={(e) => setSelectedListId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary font-medium"
              >
                {lists.filter((l) => !l.isArchived).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} {l.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Item Name <span className="text-danger-primary">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sourdough Bread, Almond Milk"
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Category <span className="text-danger-primary">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Priority <span className="text-danger-primary">*</span>
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
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Quantity <span className="text-danger-primary">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Unit <span className="text-danger-primary">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, cartons, kg, L"
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Estimated Price */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Estimated Price (₹, optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="e.g. 150.00"
              className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            />
            <p className="text-[12px] text-text-muted mt-1">
              Used for your shopping budget estimate. Excluded if left blank.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Notes (optional)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefer unsweetened, check expiry at store"
              className="w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 py-2 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary resize-none"
            />
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
              {submitting ? 'Saving...' : initialItem ? 'Save Changes' : 'Add to List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
