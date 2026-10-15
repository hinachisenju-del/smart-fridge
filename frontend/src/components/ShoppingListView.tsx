import {
  Archive,
  CheckCircle2,
  CheckSquare,
  DollarSign,
  Edit2,
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  SHOPPING_PRIORITY_LABELS,
  type Category,
  type LowStockSuggestion,
  type MlRestockPrediction,
  type MlRestockResponse,
  type ShoppingBudgetSummary,
  type ShoppingItemPriority,
  type ShoppingList,
  type ShoppingListItem,
} from '../types/inventory';
import { renderListIcon } from './CreateEditListModal';
import { CompletionProgress } from './reactbits/CompletionProgress';
import { MlSuggestionsCard } from './reactbits/MlSuggestionsCard';

interface ShoppingListViewProps {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  onSelectList: (listId: number) => void;
  onOpenCreateListModal: () => void;
  onEditList: (list: ShoppingList) => void;
  onArchiveList: (list: ShoppingList) => void;
  onDeleteList: (list: ShoppingList) => void;
  items: ShoppingListItem[];
  budget: ShoppingBudgetSummary | null;
  suggestions: LowStockSuggestion[];
  mlData?: MlRestockResponse | null;
  mlLoading?: boolean;
  onAddMlSuggestion?: (pred: MlRestockPrediction) => void;
  onRefreshMl?: () => void;
  loading: boolean;
  search: string;
  categoryFilter: Category | '';
  priorityFilter: ShoppingItemPriority | '';
  sortBy: 'name' | 'priority' | 'category';
  sortDir: 'asc' | 'desc';
  onSearchChange: (val: string) => void;
  onCategoryFilterChange: (cat: Category | '') => void;
  onPriorityFilterChange: (pri: ShoppingItemPriority | '') => void;
  onSortByChange: (sort: 'name' | 'priority' | 'category') => void;
  onSortDirToggle: () => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onEditItem: (item: ShoppingListItem) => void;
  onDeleteItem: (item: ShoppingListItem) => void;
  onTogglePurchased: (item: ShoppingListItem) => Promise<void>;
  onClearPurchased: () => void;
  onConvertPurchased: (item: ShoppingListItem) => void;
  onAddSuggestion: (suggestion: LowStockSuggestion) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const PRIORITIES: ShoppingItemPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

function renderPriorityBadge(priority: ShoppingItemPriority) {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-danger-subtle text-danger-primary border border-red-200">
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-brand-primary border border-border-default dark:border-border-default">
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 border border-border-default dark:border-border-strong">
          Low
        </span>
      );
  }
}

export function ShoppingListView({
  lists,
  activeList,
  onSelectList,
  onOpenCreateListModal,
  onEditList,
  onArchiveList,
  onDeleteList,
  items,
  budget,
  suggestions,
  mlData,
  mlLoading,
  onAddMlSuggestion,
  onRefreshMl,
  loading,
  search,
  categoryFilter,
  priorityFilter,
  sortBy,
  sortDir,
  onSearchChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  onSortByChange,
  onSortDirToggle,
  onResetFilters,
  onRefresh,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
  onTogglePurchased,
  onClearPurchased,
  onConvertPurchased,
  onAddSuggestion,
}: ShoppingListViewProps) {
  const activeLists = lists.filter((l) => !l.isArchived);
  const uncheckedItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);

  const hasActiveFilters = Boolean(search || categoryFilter || priorityFilter);
  const pendingSuggestions = suggestions.filter((s) => !s.alreadyInShoppingList);

  return (
    <div data-testid="shopping-list-page" className="space-y-6">
      {/* Top Header & Actions */}
      <div className="space-y-4 border-b border-border-default dark:border-border-default pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeList?.color || '#4F46E5' }}
              />
              <span className="text-[12px] font-semibold text-text-secondary">
                {activeList?.isDefault ? 'Primary List' : 'Custom List'}
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-[36px] text-text-primary mt-0.5">
              {activeList?.title || 'Shopping List'}
            </h1>
            <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
              Checklist and budget estimation for your active list.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="shopping-refresh-btn"
              onClick={onRefresh}
              disabled={loading}
              className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {purchasedItems.length > 0 && (
              <button
                type="button"
                data-testid="shopping-clear-purchased-btn"
                onClick={onClearPurchased}
                className="h-[40px] px-3.5 rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-danger-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Purchased ({purchasedItems.length})</span>
              </button>
            )}

            <button
              type="button"
              data-testid="shopping-add-btn"
              onClick={onOpenAddModal}
              className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* List Switcher Tab Strip */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-border-subtle dark:border-border-default">
          <div className="flex items-center gap-2 flex-wrap" data-testid="list-switcher-strip">
            <span className="text-[13px] font-medium text-text-secondary dark:text-slate-400 mr-1">Lists:</span>
            {activeLists.map((list) => {
              const isActive = activeList?.id === list.id;
              return (
                <button
                  key={list.id}
                  type="button"
                  data-testid={`list-tab-${list.id}`}
                  onClick={() => onSelectList(list.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-brand-primary font-semibold border border-border-default dark:border-border-default'
                      : 'border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary text-text-secondary dark:text-slate-400 hover:bg-surface-secondary dark:hover:bg-surface-tertiary hover:text-text-primary dark:hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: list.color || '#4F46E5' }}
                  />
                  <span>{list.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                      isActive ? 'bg-surface-primary dark:bg-surface-secondary text-brand-primary dark:text-brand-primary font-semibold' : 'bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400'
                    }`}
                  >
                    {list.uncheckedItemCount}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              data-testid="new-list-pill-btn"
              onClick={onOpenCreateListModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-dashed border-border-strong dark:border-border-default bg-surface-secondary/50 dark:bg-surface-secondary hover:bg-surface-secondary/50 text-brand-primary dark:text-brand-primary text-[13px] font-medium transition-colors duration-150 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New List</span>
            </button>
          </div>

          {/* Active List Options */}
          {activeList && (
            <div className="flex items-center gap-1 text-[13px] text-text-secondary dark:text-slate-400">
              <button
                type="button"
                onClick={() => onEditList(activeList)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] hover:bg-surface-secondary dark:hover:bg-surface-tertiary text-text-primary dark:text-white transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-brand-primary dark:text-text-primary" />
                <span>Rename / Settings</span>
              </button>

              {!activeList.isDefault && (
                <button
                  type="button"
                  onClick={() => onArchiveList(activeList)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] hover:bg-surface-secondary text-text-primary transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-warning-primary" />
                  <span>Archive</span>
                </button>
              )}

              {!activeList.isDefault && (
                <button
                  type="button"
                  onClick={() => onDeleteList(activeList)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] hover:bg-danger-subtle text-danger-primary transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="rounded-[10px] border border-border-default bg-surface-primary shadow-card grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
        {/* Estimated Total */}
        <div data-testid="budget-summary-card" className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary dark:text-slate-400">
            <span className="text-[12px] font-medium">Pending Cost</span>
            <DollarSign className="w-4 h-4 text-brand-primary dark:text-text-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary dark:text-white leading-tight">
            ₹{budget?.uncheckedEstimatedTotal != null ? budget.uncheckedEstimatedTotal.toFixed(2) : '0.00'}
          </p>
          <p className="text-[12px] text-text-muted dark:text-slate-400 leading-[18px]">
            {budget?.uncheckedItemsWithPriceCount ?? 0} priced items ({budget?.uncheckedItemsWithoutPriceCount ?? 0} unpriced)
          </p>
        </div>

        {/* Items to Buy */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary dark:text-slate-400">
            <span className="text-[12px] font-medium">To Buy</span>
            <ShoppingBag className="w-4 h-4 text-brand-primary dark:text-text-primary" />
          </div>
          <p data-testid="shopping-unpurchased-count" className="text-[28px] font-bold text-text-primary dark:text-white leading-tight">
            {uncheckedItems.length}
          </p>
          <p className="text-[12px] text-text-muted dark:text-slate-400 leading-[18px]">Active items pending purchase</p>
        </div>

        {/* Progress Tracker */}
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Completed</span>
            <CheckSquare className="w-4 h-4 text-success-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p data-testid="shopping-purchased-count" className="text-[28px] font-bold text-success-primary leading-tight">
              {purchasedItems.length}
            </p>
            <span className="text-[13px] text-text-secondary">purchased</span>
          </div>
          <p className="text-[12px] text-text-muted leading-[18px]">
            {items.length > 0
              ? `${Math.round((purchasedItems.length / items.length) * 100)}% of list completed`
              : 'No items yet'}
          </p>
        </div>
      </div>

      {/* Visual Completion Progress Widget (React Bits) */}
      {items.length > 0 && (
        <CompletionProgress
          completed={purchasedItems.length}
          total={items.length}
          label={`${activeList?.title || 'Active List'} Completion`}
        />
      )}

      {/* Smart Restock Predictor (Scikit-Learn Machine Learning) */}
      <MlSuggestionsCard
        mlData={mlData ?? null}
        loading={mlLoading ?? false}
        activeList={activeList}
        onAddToList={(pred) => onAddMlSuggestion?.(pred)}
        onRefreshMl={() => onRefreshMl?.()}
      />

      {/* Smart Restock Suggestions */}
      {pendingSuggestions.length > 0 && (
        <section
          data-testid="smart-suggestions-section"
          className="rounded-[10px] border border-[#FFF1D6] bg-warning-subtle/50 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warning-primary" />
            <h2 className="text-[13px] font-semibold text-warning-primary">
              Smart Restock Suggestions ({pendingSuggestions.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSuggestions.map((suggestion) => (
              <div
                key={suggestion.inventoryItemId}
                data-testid={`suggestion-card-${suggestion.inventoryItemId}`}
                className="rounded-[8px] border border-border-default bg-surface-primary p-3.5 flex flex-col justify-between gap-3 shadow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[13px] text-text-primary truncate">
                      {suggestion.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-surface-secondary text-text-secondary shrink-0 font-medium">
                      {CATEGORY_LABELS[suggestion.category]}
                    </span>
                  </div>
                  <p className="text-[11px] text-warning-primary mt-1">
                    Stock: {suggestion.currentQuantity} / {suggestion.minimumStockThreshold} {suggestion.unit}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid={`add-suggestion-btn-${suggestion.inventoryItemId}`}
                  onClick={() => onAddSuggestion(suggestion)}
                  className="w-full h-[32px] inline-flex items-center justify-center gap-1.5 px-3 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[12px] font-semibold transition-colors duration-150 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add +{suggestion.suggestedQuantity} {suggestion.unit}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search, Filter & Sort Toolbar */}
      <div className="rounded-[10px] border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-text-muted dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="shopping-search-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search items..."
              className="w-full h-[42px] rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary pl-9 pr-3 text-[14px] text-text-primary dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              data-testid="shopping-category-filter"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value as Category | '')}
              aria-label="Filter by category"
              className="w-full h-[42px] rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary px-3 text-[14px] text-text-primary dark:text-white focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              data-testid="shopping-priority-filter"
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as ShoppingItemPriority | '')}
              aria-label="Filter by priority"
              className="w-full h-[42px] rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary px-3 text-[14px] text-text-primary dark:text-white focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {SHOPPING_PRIORITY_LABELS[pri]}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex gap-2">
            <select
              data-testid="shopping-sort-by-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'name' | 'priority' | 'category')}
              aria-label="Sort by"
              className="flex-1 h-[42px] rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary px-3 text-[14px] text-text-primary dark:text-white focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="priority">Priority</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>
            <button
              type="button"
              data-testid="shopping-sort-dir-toggle"
              onClick={onSortDirToggle}
              title={`Sorting ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
              className="h-[42px] px-3 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 text-[13px] font-semibold text-text-primary dark:text-white transition-colors cursor-pointer shrink-0"
            >
              {sortDir.toUpperCase()}
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[12px] pt-2 border-t border-border-subtle dark:border-border-default">
            <span className="text-text-secondary dark:text-slate-400">Filters active</span>
            <button
              type="button"
              data-testid="shopping-reset-filters-btn"
              onClick={onResetFilters}
              className="text-brand-primary dark:text-text-primary hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Empty List State */}
      {items.length === 0 && !hasActiveFilters ? (
        <div
          data-testid="empty-list-state"
          className="p-10 text-center rounded-[10px] border border-dashed border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary space-y-3"
        >
          <div
            className="w-10 h-10 rounded-[6px] mx-auto flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: activeList?.color || '#4F46E5' }}
          >
            {renderListIcon(activeList?.icon || 'shopping-bag', 'w-5 h-5')}
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-text-primary dark:text-white">
              "{activeList?.title || 'This list'}" is empty
            </h3>
            <p className="text-[13px] text-text-secondary dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
              Add groceries to this list, or restock items from your pantry suggestions.
            </p>
          </div>
          <button
            type="button"
            data-testid="empty-add-item-btn"
            onClick={onOpenAddModal}
            className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Item</span>
          </button>
        </div>
      ) : (
        <>
          {/* 1. Pending (To Buy) Section */}
          <section data-testid="unpurchased-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-text-primary dark:text-white flex items-center gap-2">
                <span>To Buy</span>
                <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-brand-primary">
                  {uncheckedItems.length}
                </span>
              </h2>
            </div>

            {uncheckedItems.length === 0 ? (
              <div className="p-6 text-center rounded-[10px] border border-dashed border-border-default bg-surface-primary space-y-1">
                <CheckCircle2 className="w-6 h-6 text-success-primary mx-auto" />
                <p className="text-[14px] font-semibold text-text-primary">
                  All items on this list have been purchased!
                </p>
                <p className="text-[12px] text-text-muted">
                  Restock items into your pantry inventory from the section below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {uncheckedItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`shopping-item-row-${item.id}`}
                    className="rounded-[8px] border border-border-default bg-surface-primary px-4 py-3 shadow-card hover:border-border-strong transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Checkbox and Details */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => onTogglePurchased(item)}
                        aria-label={`Mark ${item.name} as purchased`}
                        className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-border-default dark:border-border-strong cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-text-primary dark:text-white truncate">
                            {item.name}
                          </span>
                          {renderPriorityBadge(item.priority)}
                          <span className="px-2 py-0.5 rounded-[4px] text-[11px] bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 font-medium">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[12px] text-text-secondary dark:text-slate-400 mt-1 flex-wrap">
                          <span>
                            Qty: <strong className="text-text-primary dark:text-white font-semibold">{item.quantity} {item.unit}</strong>
                          </span>
                          {item.estimatedPrice != null && (
                            <span>
                              Price:{' '}
                              <strong className="text-brand-primary dark:text-text-primary font-semibold">
                                ₹{(item.estimatedPrice * item.quantity).toFixed(2)}
                              </strong>{' '}
                              (₹{item.estimatedPrice.toFixed(2)}/{item.unit})
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-text-muted dark:text-slate-400 italic truncate">Note: {item.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        data-testid={`edit-shopping-item-${item.id}`}
                        onClick={() => onEditItem(item)}
                        className="p-1.5 rounded-[6px] text-text-secondary dark:text-slate-400 hover:bg-surface-secondary dark:hover:bg-surface-tertiary hover:text-text-primary dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-shopping-item-${item.id}`}
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 rounded-[6px] text-danger-primary dark:text-rose-400 hover:bg-danger-subtle dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. Purchased Section */}
          {purchasedItems.length > 0 && (
            <section data-testid="purchased-section" className="space-y-3 pt-4 border-t border-border-default dark:border-border-default">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-text-secondary dark:text-slate-400 flex items-center gap-2">
                  <span>Purchased</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                    {purchasedItems.length}
                  </span>
                </h2>
                <span className="text-[12px] text-text-muted dark:text-slate-400">
                  Restock into pantry inventory when unpacking
                </span>
              </div>

              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`purchased-item-row-${item.id}`}
                    className="rounded-[8px] border border-border-subtle dark:border-border-default bg-surface-page dark:bg-surface-primary/60 px-4 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => onTogglePurchased(item)}
                        aria-label={`Uncheck ${item.name}`}
                        className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-border-default dark:border-border-strong cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-text-muted dark:text-slate-500 line-through truncate">
                            {item.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        <p className="text-[12px] text-text-muted dark:text-slate-400 mt-0.5">
                          {item.quantity} {item.unit}
                          {item.estimatedPrice != null &&
                            ` · ₹${(item.estimatedPrice * item.quantity).toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        data-testid={`add-to-fridge-btn-${item.id}`}
                        onClick={() => onConvertPurchased(item)}
                        className="h-[32px] inline-flex items-center gap-1.5 px-3 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[12px] font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock to Pantry</span>
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-purchased-item-${item.id}`}
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 rounded-[6px] text-danger-primary dark:text-rose-400 hover:bg-danger-subtle dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
