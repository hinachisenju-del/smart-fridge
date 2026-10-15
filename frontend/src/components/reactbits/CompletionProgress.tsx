import React from 'react';

interface CompletionProgressProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
  showCircular?: boolean;
}

/**
 * CompletionProgress (React Bits)
 * Displays task or shopping completion with an animated progress bar and optional circular badge.
 * Fully accessible with ARIA progressbar semantics.
 */
export const CompletionProgress: React.FC<CompletionProgressProps> = ({
  completed,
  total,
  label = 'Completed',
  className = '',
  showCircular = false,
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = total > 0 && completed === total;

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${completed} of ${total} (${percent}%)`}
      className={`rounded-[10px] border border-border-default bg-surface-primary p-4 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text-primary">
            {label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-secondary text-text-secondary border border-border-default">
            {completed} / {total} items
          </span>
        </div>
        <span
          className={`text-[14px] font-bold ${
            isAllDone ? 'text-success-primary' : 'text-text-primary'
          }`}
        >
          {percent}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden relative border border-border-subtle">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isAllDone ? 'bg-success-primary' : 'bg-brand-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {showCircular && (
        <div className="mt-3 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface-secondary"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isAllDone ? 'text-success-primary' : 'text-brand-primary'}
              strokeDasharray={`${percent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
