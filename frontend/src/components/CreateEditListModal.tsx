import { useState, useEffect } from 'react';
import {
  Bookmark,
  Boxes,
  Calendar,
  Coffee,
  Heart,
  Home,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import {
  RESTRAINED_LIST_COLORS,
  RESTRAINED_LIST_ICONS,
  type ShoppingList,
  type ShoppingListPayload,
} from '../types/inventory';

interface CreateEditListModalProps {
  isOpen: boolean;
  editingList: ShoppingList | null;
  onClose: () => void;
  onSubmit: (payload: ShoppingListPayload) => Promise<void>;
}

export function renderListIcon(iconName: string, className = 'w-4 h-4') {
  switch (iconName) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'boxes':
      return <Boxes className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'shopping-bag':
    default:
      return <ShoppingBag className={className} />;
  }
}

export function CreateEditListModal({
  isOpen,
  editingList,
  onClose,
  onSubmit,
}: CreateEditListModalProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0b292f');
  const [icon, setIcon] = useState('shopping-bag');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingList) {
      setTitle(editingList.title);
      setColor(editingList.color || '#0b292f');
      setIcon(editingList.icon || 'shopping-bag');
    } else {
      setTitle('');
      setColor('#0b292f');
      setIcon('shopping-bag');
    }
    setError(null);
  }, [editingList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('List title is required.');
      return;
    }
    if (cleanTitle.length > 120) {
      setError('List title cannot exceed 120 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: cleanTitle,
        color,
        icon,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save list settings.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-inverse/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-surface-primary rounded-[14px] border border-border-default shadow-popover w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-page">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {renderListIcon(icon, 'w-4 h-4')}
            </div>
            <div>
              <h2 id="list-modal-title" className="text-[16px] font-semibold text-text-primary">
                {editingList ? 'Edit List Settings' : 'Create New List'}
              </h2>
              <p className="text-[12px] text-text-secondary">
                {editingList ? 'Update title, color, or icon' : 'Organize items by store, occasion, or goal'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-surface-primary">
          {error && (
            <div className="p-3 rounded-[6px] bg-danger-subtle border border-red-200 text-[13px] text-danger-primary font-medium">
              {error}
            </div>
          )}

          {/* List Title */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              List Title <span className="text-danger-primary">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Groceries, Costco Run, Party Prep"
              maxLength={120}
              className="h-[42px] w-full px-3.5 text-[14px] rounded-[6px] border border-border-default bg-surface-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {RESTRAINED_LIST_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition transform cursor-pointer flex items-center justify-center ${
                    color === c.hex
                      ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              List Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {RESTRAINED_LIST_ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  title={ic.label}
                  onClick={() => setIcon(ic.id)}
                  className={`p-2 rounded-[6px] border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                    icon === ic.id
                      ? 'border-indigo-500 bg-surface-secondary text-brand-primary font-semibold ring-1 ring-indigo-500'
                      : 'border-border-default bg-surface-page text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  }`}
                >
                  {renderListIcon(ic.id, 'w-4 h-4')}
                  <span className="text-[10px] truncate max-w-full">{ic.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] border border-border-default bg-surface-primary text-[14px] font-semibold text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover active:bg-surface-inverse text-brand-text text-[14px] font-semibold shadow-card transition-colors cursor-pointer flex items-center gap-2"
            >
              {submitting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <span>{editingList ? 'Save Changes' : 'Create List'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
