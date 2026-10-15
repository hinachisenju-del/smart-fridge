import {
  CheckCircle2,
  DollarSign,
  Info,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import type {
  Category,
  ShoppingBudgetSummary,
  ShoppingListItem,
} from '../types/inventory';
import { CATEGORY_LABELS } from '../types/inventory';

interface BudgetViewProps {
  budget: ShoppingBudgetSummary | null;
  items: ShoppingListItem[];
  loading: boolean;
  onRefresh: () => void;
  onEditItem: (item: ShoppingListItem) => void;
  onNavigateToShopping: () => void;
}

export function BudgetView({
  budget,
  items,
  loading,
  onRefresh,
  onEditItem,
  onNavigateToShopping,
}: BudgetViewProps) {
  const pendingTotal = budget?.uncheckedEstimatedTotal ?? 0;
  const completedTotal = budget?.checkedEstimatedTotal ?? 0;
  const grandTotal = pendingTotal + completedTotal;

  const pricedItems = items.filter((i) => i.estimatedPrice != null);
  const unpricedItems = items.filter((i) => i.estimatedPrice == null);

  return (
    <div data-testid="budget-page" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">
            Budget & Spending Estimates
          </h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Real-time cost estimates based on prices on your active shopping list.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="budget-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="budget-to-checklist-btn"
            onClick={onNavigateToShopping}
            className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-card cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open Checklist</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Pending Purchases Budget */}
        <div className="p-5 rounded-[10px] border border-border-default bg-surface-primary shadow-card space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Pending Purchases</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">₹{pendingTotal.toFixed(2)}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">
            {budget?.uncheckedItemsWithPriceCount ?? 0} of {budget?.totalUncheckedCount ?? 0} to-buy items priced
          </p>
        </div>

        {/* Card 2: Completed Purchases */}
        <div className="p-5 rounded-[10px] border border-border-default bg-surface-primary shadow-card space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Completed Purchases</span>
            <CheckCircle2 className="w-4 h-4 text-success-primary" />
          </div>
          <p className="text-[28px] font-bold text-success-primary leading-tight">₹{completedTotal.toFixed(2)}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">
            {budget?.checkedItemsWithPriceCount ?? 0} of {budget?.totalCheckedCount ?? 0} purchased items priced
          </p>
        </div>

        {/* Card 3: Total Spend */}
        <div className="p-5 rounded-[10px] border border-border-default bg-surface-primary shadow-card space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Total Cycle Spend</span>
            <DollarSign className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">₹{grandTotal.toFixed(2)}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">
            Pending + already purchased
          </p>
        </div>
      </div>

      {/* Pricing Accuracy Banner */}
      <div className="rounded-[10px] border border-border-default bg-surface-secondary p-4 flex items-start gap-3 text-[13px] text-text-secondary">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-text-primary">Transparent Budget Estimation</p>
          <p className="leading-relaxed">
            Estimates only calculate totals from items that have an explicitly entered price. Unpriced items ({unpricedItems.length}) are never assigned invented or fake prices. Click on any item below to add or adjust its estimated price.
          </p>
        </div>
      </div>

      {/* Itemized Cost Breakdown Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-default pb-2">
          <h2 className="text-[16px] font-semibold text-text-primary">
            Itemized Cost Breakdown ({pricedItems.length} priced)
          </h2>
          <span className="text-[12px] text-text-muted">
            Sorted by total value
          </span>
        </div>

        {pricedItems.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border-default bg-surface-primary p-8 text-center space-y-2">
            <DollarSign className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-[15px] font-semibold text-text-primary">No items have prices assigned yet</p>
            <p className="text-[13px] text-text-secondary max-w-sm mx-auto">
              Add estimated unit prices when adding or editing items to see your projected budget and running totals.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToShopping}
                className="h-[36px] px-3.5 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Edit Items in Shopping List</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[10px] border border-border-default bg-surface-primary overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] text-text-primary">
                <thead className="bg-surface-secondary text-[12px] font-semibold text-text-secondary border-b border-border-default">
                  <tr>
                    <th scope="col" className="px-4 py-3">Item</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                    <th scope="col" className="px-4 py-3 text-right">Est. Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEBE5]">
                  {pricedItems
                    .slice()
                    .sort((a, b) => ((b.estimatedPrice ?? 0) * b.quantity) - ((a.estimatedPrice ?? 0) * a.quantity))
                    .map((item) => {
                      const unitPrice = item.estimatedPrice ?? 0;
                      const subtotal = unitPrice * item.quantity;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => onEditItem(item)}
                          className="hover:bg-surface-page transition-colors cursor-pointer"
                          title="Click to edit item or price"
                        >
                          <td className="px-4 py-3 font-semibold text-text-primary">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-text-secondary">
                            {CATEGORY_LABELS[item.category as Category]}
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                item.purchased
                                  ? 'bg-surface-secondary text-success-primary'
                                  : 'bg-surface-secondary text-text-secondary'
                              }`}
                            >
                              {item.purchased ? 'Purchased' : 'To Buy'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-right text-text-secondary">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-right text-text-secondary">
                            ₹{unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-right text-text-primary">
                            ₹{subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Unpriced Items List */}
      {unpricedItems.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border-default pb-2">
            <h2 className="text-[14px] font-semibold text-text-secondary">
              Items Without Estimated Prices ({unpricedItems.length})
            </h2>
            <span className="text-[12px] text-text-muted">
              Click any item to set an estimated price
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {unpricedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onEditItem(item)}
                className="h-[36px] px-3 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[13px] font-medium text-text-primary transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>{item.name}</span>
                <span className="text-text-muted">({item.quantity} {item.unit})</span>
                <span className="text-brand-primary font-semibold">+ Price</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
