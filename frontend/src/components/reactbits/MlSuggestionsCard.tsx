import React from 'react';
import { Sparkles, Brain, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import type { MlRestockPrediction, MlRestockResponse, ShoppingList } from '../../types/inventory';
import { AnimatedList } from './AnimatedList';

interface MlSuggestionsCardProps {
  mlData: MlRestockResponse | null;
  loading: boolean;
  activeList: ShoppingList | null;
  onAddToList: (prediction: MlRestockPrediction) => void;
  onRefreshMl: () => void;
}

export const MlSuggestionsCard: React.FC<MlSuggestionsCardProps> = ({
  mlData,
  loading,
  activeList,
  onAddToList,
  onRefreshMl,
}) => {
  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-border-default bg-surface-primary shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-text-primary animate-pulse" />
          <span className="text-sm font-semibold text-text-primary">
            Calculating consumption velocity with ML model...
          </span>
        </div>
      </div>
    );
  }

  const isColdStart = mlData ? (mlData.coldStart ?? mlData.cold_start ?? true) : true;
  const suggestions = mlData?.suggestions ?? [];

  return (
    <section
      data-testid="ml-restock-predictions-section"
      className="p-5 rounded-xl border border-border-default bg-surface-primary shadow-card space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary text-text-primary flex items-center justify-center shrink-0 border border-border-default">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">Smart Restock Predictor</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-secondary text-text-secondary border border-border-default">
                Scikit-Learn ML
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Time-aware pantry depletion forecasting with zero speculative auto-adds.
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="ml-refresh-btn"
          onClick={onRefreshMl}
          className="text-xs text-text-secondary hover:text-text-primary font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-border-default bg-surface-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Re-score Model</span>
        </button>
      </div>

      {/* Body: Cold-start or Active Predictions */}
      {isColdStart || suggestions.length === 0 ? (
        <div
          data-testid="ml-cold-start-banner"
          className="p-4 rounded-lg border border-dashed border-border-strong bg-surface-secondary/70 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-warning-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-primary">
                Cold-Start State: Insufficient History (&lt; 3 records)
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {mlData?.message ||
                  'The Random Forest regressor requires at least 3 active pantry items or purchase records to estimate household consumption rate without hallucinating.'}
              </p>
              <p className="text-[11px] text-text-muted">
                Tip: Add common staples (milk, eggs, vegetables) in the Inventory tab to unlock live restock suggestions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-secondary font-medium">
            Predicted depletion alerts for{' '}
            <strong className="text-text-primary">{activeList?.title || 'Active List'}</strong>{' '}
            (Requires explicit user approval):
          </p>

          <AnimatedList
            items={suggestions}
            keyExtractor={(item, idx) => item.itemId ?? idx}
            renderItem={(item) => (
              <div
                key={item.itemId || item.name}
                data-testid={`ml-suggestion-card-${item.itemId ?? item.name}`}
                className="p-3.5 rounded-lg border border-border-default hover:border-border-strong bg-surface-primary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors shadow-xs"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary truncate">{item.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-secondary text-text-muted font-medium border border-border-subtle">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.urgency === 'URGENT' || item.urgency === 'HIGH'
                          ? 'bg-danger-subtle text-danger-text border border-danger-border'
                          : 'bg-warning-subtle text-warning-text border border-warning-border'
                      }`}
                    >
                      Depletes in ~{item.predictedDaysUntilDepleted}d
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-normal">{item.reasoning}</p>

                  <div className="flex items-center gap-2 text-[11px] text-text-muted pt-0.5">
                    <span>Model Confidence: {Math.round(item.confidence * 100)}%</span>
                    <span>•</span>
                    <span>Current: {item.currentQuantity} {item.unit}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    data-testid={`ml-add-btn-${item.itemId ?? item.name}`}
                    onClick={() => onAddToList(item)}
                    className="w-full sm:w-auto h-8 px-3 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add to List</span>
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </section>
  );
};
