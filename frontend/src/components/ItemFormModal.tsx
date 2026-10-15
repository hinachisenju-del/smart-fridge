import { type FormEvent, useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
  CATEGORY_LABELS,
  EXPIRY_SOURCE_LABELS,
  STORAGE_LOCATION_LABELS,
  type Category,
  type ExpirySource,
  type GroceryItem,
  type GroceryItemPayload,
  type StorageLocation,
} from '../types/inventory';
import { ApiError } from '../api/inventoryApi';

interface ItemFormModalProps {
  isOpen: boolean;
  initialItem: GroceryItem | null;
  onClose: () => void;
  onSubmit: (payload: GroceryItemPayload, editId?: number) => Promise<void>;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const LOCATIONS = Object.keys(STORAGE_LOCATION_LABELS) as StorageLocation[];
const EXPIRY_SOURCES = Object.keys(EXPIRY_SOURCE_LABELS) as ExpirySource[];
const COMMON_UNITS = ['pcs', 'L', 'ml', 'kg', 'g', 'packs', 'cartons', 'bottles', 'boxes', 'bunches'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultExpiryIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10);
}

export function ItemFormModal({
  isOpen,
  initialItem,
  onClose,
  onSubmit,
}: ItemFormModalProps) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<Category>('DAIRY');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('UPPER_SHELF');
  const [minimumStockThreshold, setMinimumStockThreshold] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [expiryDate, setExpiryDate] = useState(defaultExpiryIso());
  const [expirySource, setExpirySource] = useState<ExpirySource>('CONFIRMED');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    if (initialItem) {
      setProductName(initialItem.productName);
      setCategory(initialItem.category);
      setQuantity(String(initialItem.quantity));
      setUnit(initialItem.unit);
      setStorageLocation(initialItem.storageLocation);
      setMinimumStockThreshold(String(initialItem.minimumStockThreshold));
      setPurchaseDate(initialItem.purchaseDate);
      setExpiryDate(initialItem.expiryDate ?? '');
      setExpirySource(initialItem.expirySource ?? 'CONFIRMED');
      setPrice(initialItem.price != null ? String(initialItem.price) : '');
      setNotes(initialItem.notes ?? '');
    } else {
      setProductName('');
      setCategory('DAIRY');
      setQuantity('1');
      setUnit('pcs');
      setStorageLocation('UPPER_SHELF');
      setMinimumStockThreshold('1');
      setPurchaseDate(todayIso());
      setExpiryDate(defaultExpiryIso());
      setExpirySource('CONFIRMED');
      setPrice('');
      setNotes('');
    }
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = productName.trim();
    const trimmedUnit = unit.trim();
    const parsedQty = Number(quantity);
    const parsedThreshold = Number(minimumStockThreshold);
    const parsedPrice = price.trim() === '' ? null : Number(price);

    if (!trimmedName) {
      setErrorMessage('Product name is required.');
      return;
    }
    if (!trimmedUnit) {
      setErrorMessage('Unit is required.');
      return;
    }
    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      setErrorMessage('Quantity must be zero or a positive number. Negative quantities are not allowed.');
      return;
    }
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0) {
      setErrorMessage('Minimum stock threshold cannot be negative.');
      return;
    }
    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      setErrorMessage('Price cannot be negative.');
      return;
    }
    if (!purchaseDate) {
      setErrorMessage('Purchase date is required.');
      return;
    }

    const cleanExpiryDate = expiryDate.trim() ? expiryDate.trim() : null;
    const cleanExpirySource = cleanExpiryDate ? expirySource : null;

    const payload: GroceryItemPayload = {
      productName: trimmedName,
      category,
      quantity: parsedQty,
      unit: trimmedUnit,
      storageLocation,
      minimumStockThreshold: parsedThreshold,
      purchaseDate,
      expiryDate: cleanExpiryDate,
      expirySource: cleanExpirySource,
      price: parsedPrice,
      notes: notes.trim() ? notes.trim() : null,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload, initialItem?.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save grocery item. Please check backend connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="item-form-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl rounded-[14px] bg-surface-primary border border-border-default text-text-primary shadow-popover overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-surface-page border-b border-border-default">
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              {initialItem ? 'Edit Grocery Item' : 'Add Grocery Item'}
            </h2>
            <p className="text-[12px] text-text-secondary">
              All changes are persisted directly to your inventory database.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-4">
          {errorMessage && (
            <div
              data-testid="item-form-error"
              className="flex items-start gap-2.5 p-3 rounded-[6px] bg-danger-subtle border border-red-200 text-danger-primary text-[13px] font-medium"
            >
              <AlertCircle className="w-4 h-4 text-danger-primary shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Product Name <span className="text-danger-primary">*</span>
              </label>
              <input
                type="text"
                data-testid="input-product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Organic Whole Milk, Baby Spinach"
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Category <span className="text-danger-primary">*</span>
              </label>
              <select
                data-testid="input-category"
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
                Storage Location <span className="text-danger-primary">*</span>
              </label>
              <select
                data-testid="input-storage-location"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {STORAGE_LOCATION_LABELS[loc]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Quantity <span className="text-danger-primary">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                data-testid="input-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Unit <span className="text-danger-primary">*</span>
              </label>
              <input
                type="text"
                list="common-units-list"
                data-testid="input-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, L, kg, packs..."
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
              <datalist id="common-units-list">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Minimum Stock Threshold <span className="text-danger-primary">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                data-testid="input-min-threshold"
                value={minimumStockThreshold}
                onChange={(e) => setMinimumStockThreshold(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Optional Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                data-testid="input-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 120.00"
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Purchase Date <span className="text-danger-primary">*</span>
              </label>
              <input
                type="date"
                data-testid="input-purchase-date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Expiry Date <span className="text-danger-primary">*</span>
              </label>
              <input
                type="date"
                data-testid="input-expiry-date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-[42px] w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 text-[14px] text-text-primary focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Expiry Date Source <span className="text-danger-primary">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EXPIRY_SOURCES.map((src) => (
                  <button
                    key={src}
                    type="button"
                    data-testid={`expiry-source-${src.toLowerCase()}`}
                    onClick={() => setExpirySource(src)}
                    className={`h-[40px] px-4 rounded-[6px] border text-[13px] font-medium transition-colors cursor-pointer ${
                      expirySource === src
                        ? 'border-indigo-500 bg-surface-secondary text-brand-primary font-semibold ring-1 ring-indigo-500'
                        : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                    }`}
                  >
                    {EXPIRY_SOURCE_LABELS[src]}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                data-testid="input-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Storage tips, brand notes, or preparation reminders..."
                className="w-full rounded-[6px] border border-border-default bg-surface-primary px-3.5 py-2 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary resize-none"
              />
            </div>
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
              data-testid="submit-item-btn"
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover active:bg-surface-inverse disabled:opacity-50 text-brand-text text-[14px] font-semibold shadow-card transition-colors cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : initialItem
                  ? 'Save Changes'
                  : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
