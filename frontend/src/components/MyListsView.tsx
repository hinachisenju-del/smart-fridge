import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Boxes,
  CheckCircle2,
  Edit2,
  ExternalLink,
  FolderPlus,
  ListChecks,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type {
  DashboardSummary,
  LowStockSuggestion,
  ShoppingBudgetSummary,
  ShoppingList,
  ShoppingListItem,
} from '../types/inventory';
import { renderListIcon } from './CreateEditListModal';

interface MyListsViewProps {
  lists: ShoppingList[];
  activeListId: number | null;
  onSelectList: (listId: number) => void;
  shoppingItems: ShoppingListItem[];
  budget: ShoppingBudgetSummary | null;
  summary: DashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenShoppingList: () => void;
  onOpenInventory: () => void;
  onAddSuggestion: (suggestion: LowStockSuggestion) => void;
  onRequestCreateList: () => void;
  onEditList: (list: ShoppingList) => void;
  onArchiveList: (list: ShoppingList) => void;
  onRestoreList: (list: ShoppingList) => void;
  onDeleteList: (list: ShoppingList) => void;
  defaultShowArchived?: boolean;
}

export function MyListsView({
  lists,
  activeListId,
  onSelectList,
  shoppingItems,
  budget,
  summary,
  loading,
  onRefresh,
  onOpenShoppingList,
  onOpenInventory,
  onAddSuggestion,
  onRequestCreateList,
  onEditList,
  onArchiveList,
  onRestoreList,
  onDeleteList,
  defaultShowArchived = false,
}: MyListsViewProps) {
  const [showArchived, setShowArchived] = useState(defaultShowArchived);

  const activeLists = lists.filter((l) => !l.isArchived);
  const archivedLists = lists.filter((l) => l.isArchived);

  const purchasedItems = shoppingItems.filter((i) => i.purchased);
  const lowStockCount = summary?.lowStockCount ?? 0;
  const totalStockCount = summary?.totalInventoryCount ?? 0;
  const pendingSuggestions =
    summary?.lowStockSuggestions?.filter((s) => !s.alreadyInShoppingList) ?? [];

  const totalItemsAcrossLists = activeLists.reduce((sum, l) => sum + l.itemCount, 0);
  const totalToBuyAcrossLists = activeLists.reduce((sum, l) => sum + l.uncheckedItemCount, 0);

  return (
    <div data-testid="my-lists-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">My Lists</h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Organize your grocery and household purchases across separate lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="lists-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="create-list-btn"
            onClick={onRequestCreateList}
            className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-card cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create List</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="rounded-[10px] border border-border-default bg-surface-primary shadow-card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
        {/* Metric 1: Pending Items */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Pending Items</span>
            <ShoppingBag className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">{totalToBuyAcrossLists}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">
            Across {activeLists.length} active lists ({totalItemsAcrossLists} total)
          </p>
        </div>

        {/* Metric 2: Estimated Budget */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Estimated Total</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">
            ₹{budget?.uncheckedEstimatedTotal != null ? budget.uncheckedEstimatedTotal.toFixed(2) : '0.00'}
          </p>
          <p className="text-[12px] text-text-muted leading-[18px]">
            {budget?.uncheckedItemsWithPriceCount ?? 0} priced items on active list
          </p>
        </div>

        {/* Metric 3: Purchased */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Purchased</span>
            <CheckCircle2 className="w-4 h-4 text-success-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">{purchasedItems.length}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">Bought on current list</p>
        </div>

        {/* Metric 4: Pantry Low Stock */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Pantry Low Stock</span>
            <Boxes className="w-4 h-4 text-warning-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">{lowStockCount}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">{totalStockCount} staples monitored</p>
        </div>
      </div>

      {/* Active Lists Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[20px] font-semibold leading-[28px] text-text-primary flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-brand-primary" />
              <span>Active Lists</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-surface-secondary text-brand-primary">
              {activeLists.length}
            </span>
          </div>

          {archivedLists.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-primary hover:underline transition-colors cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>{showArchived ? 'Hide Archived' : `View Archived (${archivedLists.length})`}</span>
            </button>
          )}
        </div>

        {activeLists.length === 0 ? (
          <div className="p-8 text-center rounded-[10px] border border-dashed border-border-default bg-surface-primary space-y-3">
            <ListChecks className="w-8 h-8 text-text-muted mx-auto" />
            <h3 className="text-[16px] font-semibold text-text-primary">No active shopping lists</h3>
            <p className="text-[13px] text-text-secondary max-w-sm mx-auto">
              You do not have any active lists. Create a new list to organize your purchases.
            </p>
            <button
              type="button"
              onClick={onRequestCreateList}
              className="h-[36px] px-3.5 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First List</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLists.map((list) => {
              const isSelected = activeListId === list.id;

              return (
                <div
                  key={list.id}
                  className={`rounded-[10px] border bg-surface-primary p-5 shadow-card transition-colors duration-150 flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500'
                      : 'border-border-default hover:border-border-strong'
                  }`}
                >
                  {/* List Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: list.color || '#4F46E5' }}
                      >
                        {renderListIcon(list.icon || 'shopping-bag', 'w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[15px] font-semibold text-text-primary truncate" title={list.title}>
                            {list.title}
                          </h3>
                          {list.isDefault && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-secondary text-brand-primary border border-border-default">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-text-secondary mt-0.5">
                          {list.itemCount} items · {list.uncheckedItemCount} to buy
                        </p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-0.5 text-text-secondary">
                      <button
                        type="button"
                        title="Edit list settings"
                        onClick={() => onEditList(list)}
                        className="p-1.5 rounded-[6px] hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!list.isDefault && (
                        <button
                          type="button"
                          title="Archive list"
                          onClick={() => onArchiveList(list)}
                          className="p-1.5 rounded-[6px] hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!list.isDefault && (
                        <button
                          type="button"
                          title="Delete list"
                          onClick={() => onDeleteList(list)}
                          className="p-1.5 rounded-[6px] hover:bg-danger-subtle text-danger-primary transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Row */}
                  <div className="px-3 py-2.5 rounded-[6px] bg-surface-secondary border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="text-text-secondary text-[11px]">Est. Total</span>
                      <p className="text-[13px] font-bold text-text-primary">
                        ₹{list.estimatedTotal != null ? Number(list.estimatedTotal).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-text-secondary text-[11px]">Pending</span>
                      <p className="text-[13px] font-semibold text-brand-primary">
                        {list.uncheckedItemCount} items
                      </p>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectList(list.id);
                      onOpenShoppingList();
                    }}
                    className={`w-full h-[36px] px-3 rounded-[6px] text-[13px] font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-primary hover:bg-brand-hover text-brand-text shadow-card'
                        : 'border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Current Active List' : 'Select & View'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Archived Lists Section */}
      {showArchived && archivedLists.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border-default">
          <h2 className="text-[18px] font-semibold text-text-secondary flex items-center gap-2">
            <Archive className="w-4 h-4" />
            <span>Archived Lists ({archivedLists.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {archivedLists.map((list) => (
              <div
                key={list.id}
                className="rounded-[10px] border border-dashed border-border-strong bg-surface-secondary p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white opacity-80 shrink-0"
                    style={{ backgroundColor: list.color || '#5F6B62' }}
                  >
                    {renderListIcon(list.icon || 'shopping-bag', 'w-3.5 h-3.5')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-text-primary truncate">{list.title}</h3>
                    <p className="text-[11px] text-text-secondary">{list.itemCount} items</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Restore list"
                    onClick={() => onRestoreList(list)}
                    className="h-[32px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-brand-primary text-[12px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArchiveRestore className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    title="Delete permanently"
                    onClick={() => onDeleteList(list)}
                    className="p-1.5 rounded-[6px] text-danger-primary hover:bg-danger-subtle transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Low-Stock Pantry Suggestions Section */}
      {pendingSuggestions.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border-default">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2">
                <Boxes className="w-4 h-4 text-warning-primary" />
                <span>Pantry Restock Suggestions</span>
              </h2>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Staples currently at or below minimum threshold.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenInventory}
              className="text-[13px] font-medium text-brand-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Stock</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSuggestions.slice(0, 6).map((suggestion) => (
              <div
                key={suggestion.inventoryItemId}
                className="p-3.5 rounded-[10px] border border-[#FFF1D6] bg-warning-subtle/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-[13px] font-semibold text-text-primary truncate">
                    {suggestion.name}
                  </h4>
                  <p className="text-[11px] text-warning-primary mt-0.5">
                    {suggestion.currentQuantity} / {suggestion.minimumStockThreshold} {suggestion.unit} left
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAddSuggestion(suggestion)}
                  className="h-[30px] px-2.5 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[12px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>+{suggestion.suggestedQuantity}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
