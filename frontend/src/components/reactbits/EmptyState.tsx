import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState (React Bits)
 * Renders an accessible, clean empty container when no data or matching filters exist.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[12px] border border-dashed border-border-default dark:border-[#243049] bg-white dark:bg-[#131B2E] p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-text-primary flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 h-[38px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[13px] font-semibold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
