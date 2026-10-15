import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellOff,
  Boxes,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import type {
  DashboardSummary,
  GroceryItem,
  QuantityActionType,
} from '../types/inventory';
import { CATEGORY_LABELS, EXPIRY_SOURCE_LABELS } from '../types/inventory';

interface ExpiryAlertsViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onEditItem: (item: GroceryItem) => void;
  onDeleteItem: (item: GroceryItem) => void;
  onQuickAdjust: (id: number, action: QuantityActionType, amount?: number) => Promise<void>;
  onNavigateToInventory: () => void;
  onAddGroceryToShoppingList: (item: GroceryItem) => void;
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

export function ExpiryAlertsView({
  summary,
  loading,
  onRefresh,
  onEditItem,
  onDeleteItem,
  onQuickAdjust,
  onNavigateToInventory,
  onAddGroceryToShoppingList,
  notificationSupported,
  notificationPermission,
  notificationsEnabled,
  onToggleNotifications,
  onSendTestNotification,
}: ExpiryAlertsViewProps) {
  const expiredItems = summary?.expiredItems ?? [];
  const expiringTodayItems = summary?.expiringTodayItems ?? [];
  const expiringSoonItems = summary?.expiringSoonItems ?? [];
  const totalMonitored = summary?.totalInventoryCount ?? 0;

  return (
    <div data-testid="expiry-alerts-page" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">
            Expiry & Freshness Alerts
          </h1>
          <p className="text-[14px] text-text-secondary leading-[22px] mt-0.5">
            Monitor perishable groceries, prevent spoilage, and receive proactive freshness alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="expiry-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="h-[40px] px-3.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToInventory}
            className="h-[40px] px-4 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[14px] font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-xs cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Pantry Stock</span>
          </button>
        </div>
      </div>

      {/* Freshness Browser Notifications Banner */}
      <section
        data-testid="freshness-notifications-card"
        className="rounded-[10px] border border-border-default dark:border-border-default bg-surface-secondary dark:bg-surface-primary p-4 shadow-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[6px] bg-surface-secondary dark:bg-surface-secondary text-brand-primary dark:text-text-primary shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-text-primary dark:text-white">
                  Freshness Browser Alerts
                </h2>
                <span
                  data-testid="notification-status-badge"
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    !notificationSupported
                      ? 'bg-surface-primary dark:bg-surface-secondary text-text-secondary dark:text-slate-400 border-border-default dark:border-border-strong'
                      : notificationsEnabled && notificationPermission === 'granted'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-warning-subtle dark:bg-amber-950/40 text-warning-primary dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {!notificationSupported
                    ? 'Unsupported'
                    : notificationsEnabled && notificationPermission === 'granted'
                    ? 'Active'
                    : 'Disabled'}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary dark:text-slate-400 mt-0.5 max-w-xl">
                Get browser notifications when items in your pantry reach their expiration date. Notifications run locally in your browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {notificationSupported && notificationsEnabled && notificationPermission === 'granted' && (
              <button
                type="button"
                data-testid="test-notification-btn"
                onClick={onSendTestNotification}
                className="h-[36px] px-3 rounded-[6px] border border-border-default dark:border-border-strong bg-surface-primary dark:bg-surface-secondary hover:bg-surface-page dark:hover:bg-slate-750 text-[13px] font-semibold text-text-primary dark:text-white transition-colors cursor-pointer"
              >
                Send Test Alert
              </button>
            )}

            <button
              type="button"
              data-testid="toggle-notifications-btn"
              disabled={!notificationSupported}
              onClick={onToggleNotifications}
              className={`h-[36px] inline-flex items-center gap-1.5 px-3.5 rounded-[6px] text-[13px] font-semibold transition-colors cursor-pointer ${
                notificationsEnabled && notificationPermission === 'granted'
                  ? 'bg-danger-subtle dark:bg-rose-950/30 hover:bg-red-100 text-danger-primary dark:text-rose-400 border border-red-200 dark:border-rose-900'
                  : 'bg-brand-primary hover:bg-brand-hover text-brand-text shadow-xs'
              }`}
            >
              {notificationsEnabled && notificationPermission === 'granted' ? (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Disable Alerts</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Alerts</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Expiry Status Metric Cards */}
      <div className="rounded-[10px] border border-border-default bg-surface-primary shadow-card grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-danger-primary">
            <span className="text-[12px] font-medium">Expired</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <p className="text-[28px] font-bold text-danger-primary leading-tight">{expiredItems.length}</p>
          <p className="text-[12px] text-danger-primary/80 leading-[18px]">Past expiration date</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-warning-primary">
            <span className="text-[12px] font-medium">Expires Today</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[28px] font-bold text-warning-primary leading-tight">{expiringTodayItems.length}</p>
          <p className="text-[12px] text-warning-primary/80 leading-[18px]">Use immediately</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-warning-primary">
            <span className="text-[12px] font-medium">Expiring Soon</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[28px] font-bold text-warning-primary leading-tight">{expiringSoonItems.length}</p>
          <p className="text-[12px] text-warning-primary/80 leading-[18px]">Next 1 to 3 days</p>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[12px] font-medium">Fresh &amp; Tracked</span>
            <CheckCircle2 className="w-4 h-4 text-success-primary" />
          </div>
          <p className="text-[28px] font-bold text-text-primary leading-tight">{totalMonitored}</p>
          <p className="text-[12px] text-text-muted leading-[18px]">Total staples monitored</p>
        </div>
      </div>

      {/* 1. EXPIRED ITEMS SECTION (if any) */}
      {expiredItems.length > 0 && (
        <section data-testid="expired-items-section" className="space-y-3">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <h2 className="text-[16px] font-semibold text-danger-primary flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              <span>Expired Groceries ({expiredItems.length})</span>
            </h2>
            <span className="text-[12px] text-danger-primary font-medium">Immediate attention</span>
          </div>

          <div className="divide-y divide-red-200 rounded-[10px] border border-red-200 bg-danger-subtle/40 p-4 space-y-2">
            {expiredItems.map((item) => (
              <div
                key={item.id}
                className="pt-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-danger-primary">{item.productName}</p>
                    <span className="px-2 py-0.5 rounded-full bg-danger-subtle text-danger-primary text-[11px] font-bold border border-red-200">
                      {formatDaysLabel(item.daysUntilExpiry)}
                    </span>
                  </div>
                  <p className="text-[12px] text-danger-primary/90 mt-0.5">
                    {item.quantity} {item.unit} &bull; Expiry: {item.expiryDate}{' '}
                    ({item.expirySource ? EXPIRY_SOURCE_LABELS[item.expirySource] : 'Estimated'})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAddGroceryToShoppingList(item)}
                    className="h-[32px] px-3 rounded-[6px] border border-red-300 bg-surface-primary hover:bg-danger-subtle text-danger-primary text-[12px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Re-add to List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAdjust(item.id, 'FINISH')}
                    className="h-[32px] px-3 rounded-[6px] bg-[#A12D2D] hover:bg-red-800 text-white text-[12px] font-semibold cursor-pointer transition-colors"
                  >
                    Mark Discarded
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. EXPIRES TODAY SECTION (if any) */}
      {expiringTodayItems.length > 0 && (
        <section data-testid="expiring-today-section" className="space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h2 className="text-[16px] font-semibold text-warning-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Expires Today ({expiringTodayItems.length})</span>
            </h2>
            <span className="text-[12px] text-warning-primary font-medium">Consume today</span>
          </div>

          <div className="divide-y divide-amber-200 rounded-[10px] border border-amber-200 bg-warning-subtle/40 p-4 space-y-2">
            {expiringTodayItems.map((item) => (
              <div
                key={item.id}
                className="pt-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-warning-primary">{item.productName}</p>
                    <span className="px-2 py-0.5 rounded-full bg-warning-subtle text-warning-primary text-[11px] font-semibold border border-amber-200">
                      Expires Today
                    </span>
                  </div>
                  <p className="text-[12px] text-warning-primary/90 mt-0.5">
                    {item.quantity} {item.unit} &bull; {CATEGORY_LABELS[item.category]}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onQuickAdjust(item.id, 'USE', 1)}
                    className="h-[32px] px-3 rounded-[6px] bg-[#8B5A12] hover:bg-amber-800 text-white text-[12px] font-semibold cursor-pointer transition-colors"
                  >
                    Use 1 {item.unit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. EXPIRING SOON SECTION */}
      <section data-testid="expiring-soon-section" className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-default pb-2">
          <h2 className="text-[16px] font-semibold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning-primary" />
            <span>Expiring Soon (Next 3 Days)</span>
          </h2>
          <span className="text-[12px] text-text-secondary">
            {expiringSoonItems.length} items
          </span>
        </div>

        {expiringSoonItems.length === 0 ? (
          <div className="rounded-[10px] border border-border-default bg-surface-primary p-6 text-center space-y-1 shadow-card">
            <CheckCircle2 className="w-6 h-6 text-success-primary mx-auto" />
            <p className="text-[14px] font-semibold text-text-primary">No items expiring in the next 3 days</p>
            <p className="text-[12px] text-text-secondary">All perishable groceries in your pantry have healthy shelf life remaining.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expiringSoonItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[8px] border border-border-default bg-surface-primary p-3.5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-text-primary">{item.productName}</p>
                    <span className="px-2 py-0.5 rounded-full bg-warning-subtle text-warning-primary text-[11px] font-semibold border border-amber-200">
                      {formatDaysLabel(item.daysUntilExpiry)}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-text-secondary text-[10px] font-medium">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    Have: {item.quantity} {item.unit} &bull; Expiry Date: {item.expiryDate}{' '}
                    ({item.expirySource ? EXPIRY_SOURCE_LABELS[item.expirySource] : 'Estimated'})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onAddGroceryToShoppingList(item)}
                    className="h-[32px] px-2.5 rounded-[6px] border border-border-default dark:border-border-default bg-surface-secondary/50 dark:bg-surface-secondary hover:bg-surface-secondary/50 dark:hover:bg-indigo-900/40 text-brand-primary dark:text-brand-primary text-[12px] font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-primary dark:text-text-primary" />
                    <span>Queue Restock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="h-[32px] px-2.5 rounded-[6px] border border-border-default bg-surface-primary hover:bg-surface-secondary text-[12px] font-medium text-text-primary cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="h-[32px] w-[32px] rounded-[6px] border border-red-200 bg-danger-subtle hover:bg-red-100 text-danger-primary inline-flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete item"
                    aria-label={`Delete ${item.productName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
