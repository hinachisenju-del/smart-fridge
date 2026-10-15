import {
  ArrowUpDown,
  CheckCircle,
  Edit3,
  Minus,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  EXPIRY_SOURCE_LABELS,
  STORAGE_LOCATION_LABELS,
  type Category,
  type GroceryItem,
  type QuantityActionType,
  type StorageLocation,
} from '../types/inventory';

interface InventoryViewProps {
  items: GroceryItem[];
  loading: boolean;
  search: string;
  categoryFilter: Category | '';
  locationFilter: StorageLocation | '';
  sortBy: 'expiryDate' | 'name' | 'quantity';
  sortDir: 'asc' | 'desc';
  onSearchChange: (val: string) => void;
  onCategoryFilterChange: (val: Category | '') => void;
  onLocationFilterChange: (val: StorageLocation | '') => void;
  onSortByChange: (val: 'expiryDate' | 'name' | 'quantity') => void;
  onSortDirToggle: () => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: GroceryItem) => void;
  onOpenDeleteModal: (item: GroceryItem) => void;
  onOpenQuantityModal: (item: GroceryItem, mode: QuantityActionType) => void;
  onQuickFinish: (item: GroceryItem) => Promise<void>;
  onAddToShoppingList: (item: GroceryItem) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const LOCATIONS = Object.keys(STORAGE_LOCATION_LABELS) as StorageLocation[];

function renderExpiryBadge(item: GroceryItem) {
  if (item.expiryStatus === 'EXPIRED') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-subtle text-danger-primary border border-red-200">
        Expired ({item.daysUntilExpiry != null ? `${Math.abs(item.daysUntilExpiry)}d ago` : 'overdue'})
      </span>
    );
  }
  if (item.expiryStatus === 'EXPIRES_TODAY') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
        Expires Today
      </span>
    );
  }
  if (item.expiryStatus === 'EXPIRING_SOON') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
        Expiring Soon ({item.daysUntilExpiry}d left)
      </span>
    );
  }
  if (item.expiryStatus === 'NO_EXPIRY') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-secondary text-text-muted border border-border-default">
        No Expiry
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-secondary text-success-primary border border-border-default">
      Fresh ({item.daysUntilExpiry != null ? `${item.daysUntilExpiry}d` : ''})
    </span>
  );
}

export function InventoryView({
  items,
  loading,
  search,
  categoryFilter,
  locationFilter,
  sortBy,
  sortDir,
  onSearchChange,
  onCategoryFilterChange,
  onLocationFilterChange,
  onSortByChange,
  onSortDirToggle,
  onResetFilters,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenQuantityModal,
  onQuickFinish,
  onAddToShoppingList,
}: InventoryViewProps) {
  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(categoryFilter) || Boolean(locationFilter);

  return (
    <div data-testid="inventory-management-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">
            Pantry & Stock Inventory
          </h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Search, filter, sort, and adjust stock across your kitchen and storage locations.
          </p>
        </div>

        <button
          type="button"
          data-testid="inventory-add-btn"
          onClick={onOpenAddModal}
          className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grocery Item</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="rounded-[10px] border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by Product Name */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-text-muted dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="inventory-search-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by product name..."
              className="w-full h-[42px] rounded-[6px] border border-border-default bg-surface-primary pl-9 pr-3 text-[14px] text-text-primary focus:border-indigo-500 focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              data-testid="inventory-category-filter"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value as Category | '')}
              aria-label="Filter by category"
              className="w-full h-[42px] rounded-[6px] border border-border-default bg-surface-primary px-3 text-[14px] text-text-primary focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Storage Location Filter */}
          <div>
            <select
              data-testid="inventory-location-filter"
              value={locationFilter}
              onChange={(e) =>
                onLocationFilterChange(e.target.value as StorageLocation | '')
              }
              aria-label="Filter by storage location"
              className="w-full h-[42px] rounded-[6px] border border-border-default bg-surface-primary px-3 text-[14px] text-text-primary focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">All Storage Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {STORAGE_LOCATION_LABELS[loc]}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By & Direction */}
          <div className="flex items-center gap-2">
            <select
              data-testid="inventory-sort-by"
              value={sortBy}
              onChange={(e) =>
                onSortByChange(e.target.value as 'expiryDate' | 'name' | 'quantity')
              }
              aria-label="Sort by field"
              className="flex-1 h-[42px] rounded-[6px] border border-border-default bg-surface-primary px-3 text-[14px] text-text-primary focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="expiryDate">Sort: Expiry Date</option>
              <option value="name">Sort: Name</option>
              <option value="quantity">Sort: Quantity</option>
            </select>

            <button
              type="button"
              data-testid="inventory-sort-dir"
              onClick={onSortDirToggle}
              title={`Sort direction: ${sortDir.toUpperCase()}`}
              className="h-[42px] px-3 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 text-[13px] font-semibold text-text-primary dark:text-white inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-primary dark:text-text-primary" />
              <span>{sortDir.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle dark:border-border-default text-[12px] text-text-secondary dark:text-slate-400">
            <span>Showing {items.length} matching item(s)</span>
            <button
              type="button"
              data-testid="inventory-reset-filters-btn"
              onClick={onResetFilters}
              className="font-medium text-brand-primary dark:text-text-primary hover:underline cursor-pointer"
            >
              Clear search &amp; filters
            </button>
          </div>
        )}
      </div>

      {/* Inventory Items State Handling */}
      {loading ? (
        <div
          data-testid="inventory-loading-state"
          className="rounded-[10px] border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-12 text-center space-y-2 shadow-card"
        >
          <p className="text-[15px] font-semibold text-text-primary dark:text-white">
            Loading pantry inventory...
          </p>
          <p className="text-[13px] text-text-secondary dark:text-slate-400">
            Synchronizing shelf items with backend database.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div
          data-testid="inventory-empty-state"
          className="rounded-[10px] border border-dashed border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-12 text-center space-y-3"
        >
          <PackageOpen className="w-10 h-10 text-text-muted dark:text-slate-500 mx-auto" />
          <h2 className="text-[16px] font-semibold text-text-primary dark:text-white">
            {hasActiveFilters
              ? 'No grocery items match your current search or filters'
              : 'Your pantry inventory is empty'}
          </h2>
          <p className="text-[13px] text-text-secondary dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try clearing your search query or switching category and storage compartment filters.'
              : 'Add groceries to track shelf locations, confirmed or estimated expiry dates, and stock thresholds.'}
          </p>
          <div className="pt-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-[36px] px-3.5 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 text-[13px] font-medium text-text-primary dark:text-white transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Grocery Item</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div data-testid="inventory-items-list" className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              data-testid={`inventory-item-row-${item.id}`}
              className="rounded-[10px] border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-4 shadow-card hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              {/* Item Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-text-primary dark:text-white">
                    {item.productName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 text-[11px] font-medium">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-brand-primary text-[11px] font-semibold border border-border-default dark:border-border-default">
                    {STORAGE_LOCATION_LABELS[item.storageLocation]}
                  </span>
                  {renderExpiryBadge(item)}
                  {item.lowStock && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
                      {item.quantity === 0 ? 'Finished (0 left)' : 'Low Stock'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-secondary">
                  <span>
                    Quantity:{' '}
                    <strong
                      data-testid={`item-qty-${item.id}`}
                      className="text-text-primary font-semibold"
                    >
                      {item.quantity} {item.unit}
                    </strong>{' '}
                    (Min: {item.minimumStockThreshold} {item.unit})
                  </span>
                  <span>
                    Expiry:{' '}
                    {item.expiryDate ? (
                      <>
                        <strong className="text-text-primary">{item.expiryDate}</strong>{' '}
                        {item.expirySource && (
                          <span className="inline-block px-1.5 py-0.2 rounded-[4px] bg-surface-secondary text-text-secondary text-[10px] font-medium ml-1">
                            {EXPIRY_SOURCE_LABELS[item.expirySource]}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-text-muted">No Expiry Date</span>
                    )}
                  </span>
                  <span>Purchased: {item.purchaseDate}</span>
                  {item.price != null && <span>Price: ₹{item.price.toFixed(2)}</span>}
                </div>

                {item.notes && (
                  <p className="text-[12px] text-text-secondary italic bg-surface-page px-2.5 py-1 rounded-[6px] border border-border-subtle max-w-xl">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Quick Actions & Edit/Delete */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border-subtle">
                {/* Quick Action 1: Use a quantity */}
                <button
                  type="button"
                  data-testid={`quick-use-btn-${item.id}`}
                  onClick={() => onOpenQuantityModal(item, 'USE')}
                  disabled={item.quantity <= 0}
                  className="h-[34px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 disabled:opacity-40 text-[12px] font-medium text-text-primary dark:text-white transition-colors cursor-pointer"
                  title="Use a quantity"
                >
                  <Minus className="w-3.5 h-3.5 text-brand-primary dark:text-text-primary" />
                  <span>Use</span>
                </button>

                {/* Quick Action 2: Mark as finished */}
                <button
                  type="button"
                  data-testid={`quick-finish-btn-${item.id}`}
                  onClick={() => onQuickFinish(item)}
                  disabled={item.quantity <= 0}
                  className="h-[34px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 disabled:opacity-40 text-[12px] font-medium text-text-primary dark:text-white transition-colors cursor-pointer"
                  title="Mark item as finished (0 remaining)"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-warning-primary dark:text-amber-400" />
                  <span>Finished</span>
                </button>

                {/* Quick Action 3: Restock */}
                <button
                  type="button"
                  data-testid={`quick-restock-btn-${item.id}`}
                  onClick={() => onOpenQuantityModal(item, 'RESTOCK')}
                  className="h-[34px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                  title="Restock current inventory quantity"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Restock</span>
                </button>

                {/* Quick Action 3b: Add to Shopping List */}
                <button
                  type="button"
                  data-testid={`add-to-shopping-list-btn-${item.id}`}
                  onClick={() => onAddToShoppingList(item)}
                  className="h-[34px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default dark:border-border-default bg-surface-secondary/50 dark:bg-surface-secondary hover:bg-surface-secondary/50 dark:hover:bg-indigo-900/40 text-[12px] font-semibold text-brand-primary dark:text-brand-primary transition-colors cursor-pointer"
                  title="Queue to shopping list for purchase"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-primary dark:text-text-primary" />
                  <span>+ To List</span>
                </button>

                {/* Quick Action 4: Correct quantity */}
                <button
                  type="button"
                  data-testid={`quick-correct-btn-${item.id}`}
                  onClick={() => onOpenQuantityModal(item, 'CORRECT')}
                  className="h-[34px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Correct exact quantity"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Correct</span>
                </button>

                {/* Edit Item */}
                <button
                  type="button"
                  data-testid={`edit-item-btn-${item.id}`}
                  onClick={() => onOpenEditModal(item)}
                  className="h-[34px] w-[34px] rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary inline-flex items-center justify-center transition-colors cursor-pointer"
                  title="Edit item"
                  aria-label={`Edit ${item.productName}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete Item */}
                <button
                  type="button"
                  data-testid={`delete-item-btn-${item.id}`}
                  onClick={() => onOpenDeleteModal(item)}
                  className="h-[34px] w-[34px] rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-danger-primary inline-flex items-center justify-center transition-colors cursor-pointer"
                  title="Delete item"
                  aria-label={`Delete ${item.productName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
