import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  MinusCircle,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  EXPIRY_SOURCE_LABELS,
  STORAGE_LOCATION_LABELS,
  type DashboardSummary,
  type GroceryItem,
  type LowStockSuggestion,
  type MlRestockPrediction,
  type MlRestockResponse,
  type QuantityActionType,
  type ShoppingListItem,
} from '../types/inventory';
import { MlSuggestionsCard } from './reactbits/MlSuggestionsCard';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  mlData?: MlRestockResponse | null;
  mlLoading?: boolean;
  onAddMlSuggestion?: (pred: MlRestockPrediction) => void;
  onRefreshMl?: () => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onEditItem: (item: GroceryItem) => void;
  onDeleteItem: (item: GroceryItem) => void;
  onNavigateToInventory: (targetSearch?: string) => void;
  onNavigateToShoppingList: () => void;
  onQuickAdjust: (id: number, action: QuantityActionType, amount?: number) => Promise<void>;
  onToggleShoppingPurchased: (item: ShoppingListItem) => Promise<void>;
  onAddSuggestionToShoppingList: (suggestion: LowStockSuggestion) => void;
  notificationSupported: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  notificationsEnabled: boolean;
  onToggleNotifications: () => Promise<void>;
  onSendTestNotification: () => void;
}

function formatDaysLabel(days: number | null | undefined): string {
  if (days == null) return 'No expiry date';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `In ${days} days`;
}

export function DashboardView({
  summary,
  loading,
  mlData,
  mlLoading,
  onAddMlSuggestion,
  onRefreshMl,
  onRefresh,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
  onNavigateToInventory,
  onNavigateToShoppingList,
  onQuickAdjust,
  onToggleShoppingPurchased,
  onAddSuggestionToShoppingList,
  notificationSupported,
  notificationPermission,
  notificationsEnabled,
  onToggleNotifications,
  onSendTestNotification,
}: DashboardViewProps) {
  const totalCount = summary?.totalInventoryCount ?? 0;
  const expiredCount = summary?.expiredCount ?? 0;
  const expiringTodayCount = summary?.expiringTodayCount ?? 0;
  const expiringSoonCount = summary?.expiringSoonCount ?? 0;
  const lowStockCount = summary?.lowStockCount ?? 0;
  const shoppingCount = summary?.shoppingListCount ?? 0;

  const expiredList = summary?.expiredItems ?? [];
  const expiringTodayList = summary?.expiringTodayItems ?? [];
  const expiringSoonList = summary?.expiringSoonItems ?? [];

  return (
    <div data-testid="overview-dashboard-page" className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">
            Welcome to Smart List
          </h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Real-time grocery ledger, pantry stock monitoring, and freshness tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="dashboard-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="dashboard-quick-add-btn"
            onClick={onOpenAddModal}
            className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-card cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Item</span>
          </button>
        </div>
      </div>

      {/* Browser Notification Opt-In Card */}
      <section
        data-testid="browser-notifications-card"
        className="rounded-[10px] border border-border-default bg-surface-secondary p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-[6px] shrink-0 ${
              notificationsEnabled && notificationPermission === 'granted'
                ? 'bg-surface-secondary text-success-primary'
                : 'bg-surface-primary text-text-secondary'
            }`}
          >
            {notificationsEnabled && notificationPermission === 'granted' ? (
              <Bell className="w-5 h-5 text-success-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-text-secondary" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Browser Freshness Notifications
              </h2>
              <span
                data-testid="notification-permission-badge"
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  notificationPermission === 'granted' && notificationsEnabled
                    ? 'bg-surface-secondary text-success-primary border border-border-default'
                    : notificationPermission === 'denied'
                    ? 'bg-danger-subtle text-danger-primary border border-red-200'
                    : 'bg-surface-primary text-text-secondary border border-border-default'
                }`}
              >
                {!notificationSupported
                  ? 'Unsupported'
                  : notificationPermission === 'denied'
                  ? 'Permission Blocked'
                  : notificationPermission === 'granted' && notificationsEnabled
                  ? 'Active'
                  : 'Disabled'}
              </span>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed max-w-2xl">
              Receive free local browser alerts when groceries reach their expiry date. No third-party relays or paid APIs.
            </p>
            {notificationPermission === 'denied' && (
              <p className="text-[12px] font-medium text-danger-primary flex items-center gap-1 mt-1">
                <Info className="w-3.5 h-3.5" />
                Browser blocked notifications. Re-enable them in your browser URL bar site permissions.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {notificationsEnabled && notificationPermission === 'granted' && (
            <button
              type="button"
              data-testid="test-notification-btn"
              onClick={onSendTestNotification}
              className="h-[36px] px-3 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-page text-[13px] font-semibold text-text-primary transition-colors cursor-pointer"
            >
              Test Alert
            </button>
          )}

          <button
            type="button"
            data-testid="toggle-notifications-btn"
            disabled={!notificationSupported || notificationPermission === 'denied'}
            onClick={onToggleNotifications}
            className={`h-[36px] px-3.5 rounded-[6px] text-[13px] font-semibold transition-colors cursor-pointer ${
              notificationsEnabled && notificationPermission === 'granted'
                ? 'bg-surface-primary border border-border-default hover:bg-surface-page text-text-primary'
                : 'bg-brand-primary hover:bg-brand-hover text-brand-text shadow-xs disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {notificationsEnabled && notificationPermission === 'granted'
              ? 'Disable Alerts'
              : 'Enable Notifications'}
          </button>
        </div>
      </section>

      {/* Summary Metric Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Inventory */}
        <div
          data-testid="metric-card-total"
          className="rounded-[10px] border border-border-default bg-surface-primary p-4 shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary">Total Stock</span>
            <span className="p-1 rounded-[4px] bg-surface-secondary text-text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span data-testid="metric-total-count" className="text-[28px] font-bold text-text-primary">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Expired Groceries */}
        <div
          data-testid="metric-card-expired"
          className={`rounded-[10px] border p-4 shadow-card flex flex-col justify-between ${
            expiredCount > 0 ? 'border-red-200 bg-danger-subtle' : 'border-border-default bg-surface-primary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-medium ${expiredCount > 0 ? 'text-danger-primary' : 'text-text-secondary'}`}>
              Expired
            </span>
            <span className={`p-1 rounded-[4px] ${expiredCount > 0 ? 'bg-red-100 text-danger-primary' : 'bg-surface-secondary text-text-secondary'}`}>
              <AlertOctagon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span
              data-testid="metric-expired-count"
              className={`text-[28px] font-bold ${expiredCount > 0 ? 'text-danger-primary' : 'text-text-primary'}`}
            >
              {expiredCount}
            </span>
          </div>
        </div>

        {/* Expires Today */}
        <div
          data-testid="metric-card-today"
          className={`rounded-[10px] border p-4 shadow-card flex flex-col justify-between ${
            expiringTodayCount > 0 ? 'border-amber-200 bg-warning-subtle' : 'border-border-default bg-surface-primary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-medium ${expiringTodayCount > 0 ? 'text-warning-primary' : 'text-text-secondary'}`}>
              Expires Today
            </span>
            <span className={`p-1 rounded-[4px] ${expiringTodayCount > 0 ? 'bg-amber-100 text-warning-primary' : 'bg-surface-secondary text-text-secondary'}`}>
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span
              data-testid="metric-today-count"
              className={`text-[28px] font-bold ${expiringTodayCount > 0 ? 'text-warning-primary' : 'text-text-primary'}`}
            >
              {expiringTodayCount}
            </span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          data-testid="metric-card-expiring"
          className={`rounded-[10px] border p-4 shadow-card flex flex-col justify-between ${
            expiringSoonCount > 0 ? 'border-amber-200 bg-warning-subtle' : 'border-border-default bg-surface-primary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-medium ${expiringSoonCount > 0 ? 'text-warning-primary' : 'text-text-secondary'}`}>
              Expiring Soon
            </span>
            <span className={`p-1 rounded-[4px] ${expiringSoonCount > 0 ? 'bg-amber-100 text-warning-primary' : 'bg-surface-secondary text-text-secondary'}`}>
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span
              data-testid="metric-expiring-count"
              className={`text-[28px] font-bold ${expiringSoonCount > 0 ? 'text-warning-primary' : 'text-text-primary'}`}
            >
              {expiringSoonCount}
            </span>
          </div>
        </div>

        {/* Low Stock */}
        <div
          data-testid="metric-card-low-stock"
          className={`rounded-[10px] border p-4 shadow-card flex flex-col justify-between ${
            lowStockCount > 0 ? 'border-amber-200 bg-warning-subtle' : 'border-border-default bg-surface-primary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-medium ${lowStockCount > 0 ? 'text-warning-primary' : 'text-text-secondary'}`}>
              Low Stock
            </span>
            <span className={`p-1 rounded-[4px] ${lowStockCount > 0 ? 'bg-amber-100 text-warning-primary' : 'bg-surface-secondary text-text-secondary'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2">
            <span
              data-testid="metric-low-stock-count"
              className={`text-[28px] font-bold ${lowStockCount > 0 ? 'text-warning-primary' : 'text-text-primary'}`}
            >
              {lowStockCount}
            </span>
          </div>
        </div>

        {/* Shopping List Count */}
        <div
          data-testid="metric-card-shopping"
          className="rounded-[10px] border border-border-default bg-surface-primary p-4 shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary">Shopping</span>
            <span className="p-1 rounded-[4px] bg-surface-secondary text-brand-primary">
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span data-testid="metric-shopping-list-count" className="text-[28px] font-bold text-text-primary">
              {shoppingCount}
            </span>
            <button
              type="button"
              onClick={onNavigateToShoppingList}
              className="text-[12px] font-semibold text-brand-primary hover:underline cursor-pointer"
            >
              View &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Smart Restock Predictor (Scikit-Learn Machine Learning) */}
      <MlSuggestionsCard
        mlData={mlData ?? null}
        loading={mlLoading ?? false}
        activeList={null}
        onAddToList={(pred) => onAddMlSuggestion?.(pred)}
        onRefreshMl={() => onRefreshMl?.()}
      />

      {/* 1. EXPIRED ITEMS SECTION */}
      <section
        data-testid="expired-items-section"
        className="rounded-[10px] border border-red-200 bg-surface-primary p-5 shadow-card space-y-3"
      >
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[6px] bg-danger-subtle text-danger-primary">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-danger-primary">
                Expired Groceries ({expiredCount})
              </h2>
              <p className="text-[12px] text-danger-primary/80">
                These items have passed their expiry date. Remove or finish them immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToInventory()}
            className="text-[12px] font-semibold text-danger-primary hover:underline cursor-pointer"
          >
            View in inventory &rarr;
          </button>
        </div>

        {expiredList.length === 0 ? (
          <div
            data-testid="expired-empty-state"
            className="py-5 text-center rounded-[8px] bg-surface-secondary/50 border border-border-default p-4"
          >
            <CheckCircle2 className="w-6 h-6 text-success-primary mx-auto mb-1" />
            <p className="text-[14px] font-semibold text-text-primary">
              No expired groceries in stock
            </p>
            <p className="text-[12px] text-text-secondary">
              All items in your pantry are within their shelf-life.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-red-50">
            {expiredList.map((item) => (
              <div
                key={item.id}
                data-testid={`expired-item-row-${item.id}`}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[14px] text-text-primary">
                      {item.productName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-danger-subtle text-danger-primary border border-red-200">
                      {formatDaysLabel(item.daysUntilExpiry)}
                    </span>
                    {item.expirySource && (
                      <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-text-secondary text-[11px] font-medium">
                        {EXPIRY_SOURCE_LABELS[item.expirySource]}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-secondary">
                    {item.quantity} {item.unit} &middot;{' '}
                    {STORAGE_LOCATION_LABELS[item.storageLocation]} &middot; Expiry date:{' '}
                    <strong className="text-danger-primary font-semibold">{item.expiryDate}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {item.quantity >= 1 && (
                    <button
                      type="button"
                      data-testid={`expired-use-btn-${item.id}`}
                      onClick={() => onQuickAdjust(item.id, 'USE', 1)}
                      className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-primary transition-colors cursor-pointer"
                    >
                      <MinusCircle className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Use 1</span>
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid={`expired-finish-btn-${item.id}`}
                    onClick={() => onQuickAdjust(item.id, 'FINISH')}
                    className="h-[32px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-secondary transition-colors cursor-pointer"
                  >
                    Finished
                  </button>
                  <button
                    type="button"
                    data-testid={`expired-remove-btn-${item.id}`}
                    onClick={() => onDeleteItem(item)}
                    className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-[12px] font-medium text-danger-primary transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    data-testid={`expired-view-inv-btn-${item.id}`}
                    onClick={() => onNavigateToInventory(item.productName)}
                    className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] text-[12px] font-medium text-brand-primary hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Inventory</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. EXPIRES TODAY SECTION */}
      <section
        data-testid="expiring-today-section"
        className="rounded-[10px] border border-amber-200 bg-surface-primary p-5 shadow-card space-y-3"
      >
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[6px] bg-warning-subtle text-warning-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-warning-primary">
                Expires Today ({expiringTodayCount})
              </h2>
              <p className="text-[12px] text-warning-primary/80">
                Consume these items today before shelf-life elapses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToInventory()}
            className="text-[12px] font-semibold text-warning-primary hover:underline cursor-pointer"
          >
            View in inventory &rarr;
          </button>
        </div>

        {expiringTodayList.length === 0 ? (
          <div
            data-testid="expiring-today-empty-state"
            className="py-5 text-center rounded-[8px] bg-surface-secondary border border-border-default p-4"
          >
            <CheckCircle2 className="w-6 h-6 text-success-primary mx-auto mb-1" />
            <p className="text-[14px] font-semibold text-text-primary">
              No groceries expiring today
            </p>
            <p className="text-[12px] text-text-secondary">
              Nothing expires by midnight today. Check upcoming items below.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-amber-50">
            {expiringTodayList.map((item) => (
              <div
                key={item.id}
                data-testid={`expiring-today-item-row-${item.id}`}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[14px] text-text-primary">
                      {item.productName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
                      Expires Today
                    </span>
                    {item.expirySource && (
                      <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-text-secondary text-[11px] font-medium">
                        {EXPIRY_SOURCE_LABELS[item.expirySource]}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-secondary">
                    {item.quantity} {item.unit} &middot;{' '}
                    {STORAGE_LOCATION_LABELS[item.storageLocation]} &middot; Expiry date:{' '}
                    <strong className="text-warning-primary font-semibold">{item.expiryDate}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {item.quantity >= 1 && (
                    <button
                      type="button"
                      data-testid={`expiring-today-use-btn-${item.id}`}
                      onClick={() => onQuickAdjust(item.id, 'USE', 1)}
                      className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-primary transition-colors cursor-pointer"
                    >
                      <MinusCircle className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Use 1</span>
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid={`expiring-today-finish-btn-${item.id}`}
                    onClick={() => onQuickAdjust(item.id, 'FINISH')}
                    className="h-[32px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-secondary transition-colors cursor-pointer"
                  >
                    Finished
                  </button>
                  <button
                    type="button"
                    data-testid={`expiring-today-remove-btn-${item.id}`}
                    onClick={() => onDeleteItem(item)}
                    className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-[12px] font-medium text-danger-primary transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    data-testid={`expiring-today-view-inv-btn-${item.id}`}
                    onClick={() => onNavigateToInventory(item.productName)}
                    className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] text-[12px] font-medium text-brand-primary hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Inventory</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. EXPIRING SOON SECTION & SHOPPING LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Soon Section */}
        <section
          data-testid="expiring-soon-section"
          className="lg:col-span-2 rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-3"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">
                Expiring Soon ({expiringSoonCount})
              </h2>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Groceries expiring in 1 to 3 days.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToInventory()}
              className="text-[12px] font-semibold text-brand-primary hover:underline cursor-pointer"
            >
              Manage Inventory &rarr;
            </button>
          </div>

          {expiringSoonList.length === 0 ? (
            <div
              data-testid="expiring-soon-empty-state"
              className="py-6 text-center rounded-[8px] bg-surface-secondary border border-border-default p-4"
            >
              <CheckCircle2 className="w-6 h-6 text-success-primary mx-auto mb-1" />
              <p className="text-[14px] font-semibold text-text-primary">
                No groceries expiring within 3 days
              </p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Remaining stock is fresh for 4 days or more.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EAEBE5]">
              {expiringSoonList.map((item) => (
                <div
                  key={item.id}
                  data-testid={`expiring-soon-item-row-${item.id}`}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[14px] text-text-primary">
                        {item.productName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning-primary border border-amber-200">
                        {formatDaysLabel(item.daysUntilExpiry)}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary">
                      {item.quantity} {item.unit} &middot;{' '}
                      {STORAGE_LOCATION_LABELS[item.storageLocation]} &middot; Expires {item.expiryDate}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.quantity >= 1 && (
                      <button
                        type="button"
                        data-testid={`expiring-soon-use-btn-${item.id}`}
                        onClick={() => onQuickAdjust(item.id, 'USE', 1)}
                        className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-primary transition-colors cursor-pointer"
                      >
                        <MinusCircle className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Use 1</span>
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid={`expiring-soon-finish-btn-${item.id}`}
                      onClick={() => onQuickAdjust(item.id, 'FINISH')}
                      className="h-[32px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-secondary transition-colors cursor-pointer"
                    >
                      Finished
                    </button>
                    <button
                      type="button"
                      data-testid={`expiring-soon-remove-btn-${item.id}`}
                      onClick={() => onDeleteItem(item)}
                      className="h-[32px] inline-flex items-center gap-1 px-2.5 rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-[12px] font-medium text-danger-primary transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shopping-List Preview Section */}
        <section
          data-testid="shopping-list-preview-section"
          className="rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-primary dark:text-text-primary" />
              <h2 className="text-[16px] font-semibold text-text-primary dark:text-white">Shopping Checklist</h2>
            </div>
            <button
              type="button"
              onClick={onNavigateToShoppingList}
              className="text-[12px] font-semibold text-brand-primary dark:text-text-primary hover:underline cursor-pointer"
            >
              Full List &rarr;
            </button>
          </div>

          {/* Upcoming Purchases */}
          <div className="space-y-2.5">
            {!summary?.upcomingShoppingList || summary.upcomingShoppingList.length === 0 ? (
              <div className="py-4 text-center rounded-[8px] bg-surface-secondary dark:bg-surface-secondary/60 border border-border-default dark:border-border-default p-3">
                <p className="text-[13px] font-medium text-text-secondary dark:text-slate-400">
                  No items in active shopping list
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EAEBE5] dark:divide-slate-800">
                {summary.upcomingShoppingList.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => onToggleShoppingPurchased(item)}
                        className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-border-default dark:border-border-strong cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-text-secondary dark:text-slate-400">
                          {item.quantity} {item.unit}
                          {item.estimatedPrice != null && ` · ₹${item.estimatedPrice.toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleShoppingPurchased(item)}
                      className="h-[28px] px-2 rounded-[4px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-secondary dark:hover:bg-slate-750 text-[11px] font-semibold text-brand-primary dark:text-text-primary transition-colors cursor-pointer shrink-0"
                    >
                      Mark Bought
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low-Stock Suggestions */}
          {summary?.lowStockSuggestions && summary.lowStockSuggestions.length > 0 && (
            <div className="pt-3 border-t border-border-subtle dark:border-border-default space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-text-secondary dark:text-slate-400">
                  Pantry Restock Suggestions
                </h3>
              </div>
              <div className="divide-y divide-[#EAEBE5] dark:divide-slate-800">
                {summary.lowStockSuggestions.slice(0, 3).map((suggestion) => (
                  <div
                    key={suggestion.inventoryItemId}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary dark:text-white">{suggestion.name}</p>
                      <p className="text-[11px] text-warning-primary dark:text-amber-400">
                        Stock: {suggestion.currentQuantity} / {suggestion.minimumStockThreshold} {suggestion.unit}
                      </p>
                    </div>

                    {suggestion.alreadyInShoppingList ? (
                      <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 text-[11px] font-medium shrink-0">
                        In list
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`preview-add-suggestion-${suggestion.inventoryItemId}`}
                        onClick={() => onAddSuggestionToShoppingList(suggestion)}
                        className="h-[28px] px-2.5 rounded-[4px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[11px] font-semibold transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+{suggestion.suggestedQuantity}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 4. RECENTLY UPDATED GROCERIES */}
      <section
        data-testid="recently-updated-section"
        className="rounded-[10px] border border-border-default bg-surface-primary p-5 shadow-card space-y-3"
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Recently Updated Groceries
            </h2>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Latest additions and quantity adjustments across your pantry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToInventory()}
            className="text-[12px] font-semibold text-brand-primary dark:text-text-primary hover:underline cursor-pointer"
          >
            Open Full Inventory &rarr;
          </button>
        </div>

        {!summary || summary.recentlyUpdatedGroceries.length === 0 ? (
          <div className="py-6 text-center rounded-[8px] bg-surface-secondary dark:bg-surface-secondary/60 border border-border-default dark:border-border-default p-4">
            <p className="text-[14px] font-semibold text-text-primary dark:text-white">
              Your inventory is currently empty
            </p>
            <p className="text-[12px] text-text-secondary dark:text-slate-400 mt-1 mb-3">
              Add your first grocery item to begin tracking freshness and stock levels.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-[36px] px-3.5 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Item</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.recentlyUpdatedGroceries.map((item) => (
              <div
                key={item.id}
                className="rounded-[8px] border border-border-default dark:border-border-default bg-surface-primary dark:bg-surface-primary p-3.5 flex flex-col justify-between gap-3 shadow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[14px] text-text-primary dark:text-white">
                      {item.productName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 text-[10px] font-medium">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary dark:text-slate-400 mt-1">
                    {STORAGE_LOCATION_LABELS[item.storageLocation]} &middot;{' '}
                    <strong className="text-text-primary dark:text-white font-semibold">
                      {item.quantity} {item.unit}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle dark:border-border-default text-[12px]">
                  <span className="text-text-secondary dark:text-slate-400">
                    {item.expiryDate ? `Exp: ${item.expiryDate}` : 'No Expiry'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="font-semibold text-brand-primary dark:text-text-primary hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
