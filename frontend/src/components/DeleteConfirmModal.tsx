import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { GroceryItem, ShoppingListItem } from '../types/inventory';
import { ApiError } from '../api/inventoryApi';

interface DeleteConfirmModalProps {
  item: GroceryItem | ShoppingListItem | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteConfirmModal({
  item,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(item.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to delete item. Check backend connection and retry.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      data-testid="delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-[14px] bg-surface-primary border border-border-default text-text-primary shadow-popover overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-danger-subtle border-b border-red-200">
          <div className="flex items-center gap-2.5 text-danger-primary">
            <AlertTriangle className="w-4 h-4 text-danger-primary" />
            <h2 className="text-[16px] font-semibold">Confirm Item Deletion</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-danger-primary hover:bg-red-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-[6px] bg-danger-subtle border border-red-300 text-danger-primary text-[13px] font-medium">
              {error}
            </div>
          )}

          <p className="text-[14px] text-text-secondary leading-relaxed">
            Are you sure you want to permanently remove{' '}
            <strong className="text-text-primary">
              {'productName' in item ? item.productName : item.name}
            </strong>{' '}
            ({item.quantity} {item.unit}) from your{' '}
            {'productName' in item ? 'pantry inventory' : 'shopping list'}?
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-default">
            <button
              type="button"
              data-testid="cancel-delete-btn"
              onClick={onClose}
              className="h-[40px] px-4 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[14px] font-semibold text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="confirm-delete-btn"
              disabled={deleting}
              onClick={handleConfirm}
              className="h-[40px] px-4 rounded-[6px] bg-[#A12D2D] hover:bg-[#862424] disabled:opacity-50 text-white text-[14px] font-semibold shadow-card transition-colors cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
