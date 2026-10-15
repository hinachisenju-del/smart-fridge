import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import type { ShoppingList } from '../types/inventory';

interface DeleteListConfirmModalProps {
  isOpen: boolean;
  list: ShoppingList | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  onArchiveInstead?: () => Promise<void>;
}

export function DeleteListConfirmModal({
  isOpen,
  list,
  onClose,
  onConfirmDelete,
  onArchiveInstead,
}: DeleteListConfirmModalProps) {
  if (!isOpen || !list) return null;

  const isDefault = list.isDefault;
  const isNonEmpty = list.itemCount > 0;
  const canDelete = !isDefault && !isNonEmpty;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-inverse/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-surface-primary rounded-[14px] border border-border-default shadow-popover w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-page">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center ${canDelete ? 'bg-danger-subtle text-danger-primary' : 'bg-warning-subtle text-warning-primary'}`}>
              {canDelete ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="delete-list-title" className="text-[16px] font-semibold text-text-primary">
                {canDelete ? 'Delete Shopping List' : 'List Cannot Be Deleted'}
              </h2>
              <p className="text-[12px] text-text-secondary">
                {list.title}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {isDefault ? (
            <div className="p-3.5 rounded-[6px] bg-warning-subtle border border-amber-200 text-[13px] text-warning-primary space-y-1.5">
              <p className="font-semibold">The default shopping list is protected.</p>
              <p className="text-warning-primary/90 leading-relaxed text-[12px]">
                "{list.title}" serves as your primary household replenishment queue and cannot be deleted or archived.
              </p>
            </div>
          ) : isNonEmpty ? (
            <div className="p-3.5 rounded-[6px] bg-warning-subtle border border-amber-200 text-[13px] text-warning-primary space-y-1.5">
              <p className="font-semibold">
                Cannot delete list with active items ({list.itemCount} items).
              </p>
              <p className="text-warning-primary/90 leading-relaxed text-[12px]">
                To prevent accidental data loss, Smart List prevents deleting non-empty lists. You can either delete or move all items first, or archive this list to hide it from your active views without losing history.
              </p>
            </div>
          ) : (
            <div className="text-[14px] text-text-secondary space-y-2">
              <p>
                Are you sure you want to permanently delete <strong className="text-text-primary">"{list.title}"</strong>?
              </p>
              <p className="text-[12px] text-text-muted">
                This empty list will be removed permanently. This action cannot be undone.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] px-4 rounded-[6px] border border-border-default bg-surface-primary text-[14px] font-semibold text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {isNonEmpty && onArchiveInstead && !isDefault && (
              <button
                type="button"
                onClick={async () => {
                  await onArchiveInstead();
                  onClose();
                }}
                className="h-[40px] px-4 rounded-[6px] bg-[#8B5A12] hover:bg-[#72480D] text-white text-[14px] font-semibold transition-colors cursor-pointer"
              >
                Archive List Instead
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={async () => {
                  await onConfirmDelete();
                  onClose();
                }}
                className="h-[40px] px-4 rounded-[6px] bg-[#A12D2D] hover:bg-[#862424] text-white text-[14px] font-semibold shadow-card transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
