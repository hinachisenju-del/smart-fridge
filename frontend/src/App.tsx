import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Boxes,
  Clock,
  DollarSign,
  LayoutDashboard,
  ListChecks,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { ApiError, inventoryApi } from './api/inventoryApi';
import type {
  Category,
  ConvertPurchasedPayload,
  DashboardSummary,
  GroceryItem,
  GroceryItemPayload,
  HealthStatus,
  LowStockSuggestion,
  MlRestockPrediction,
  MlRestockResponse,
  QuantityActionType,
  ShoppingBudgetSummary,
  ShoppingItemPriority,
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemPayload,
  ShoppingListPayload,
  StorageLocation,
} from './types/inventory';
import { DashboardView } from './components/DashboardView';
import { MyListsView } from './components/MyListsView';
import { ShoppingListView } from './components/ShoppingListView';
import { BudgetView } from './components/BudgetView';
import { InventoryView } from './components/InventoryView';
import { ExpiryAlertsView } from './components/ExpiryAlertsView';
import { SettingsView } from './components/SettingsView';
import { ItemFormModal } from './components/ItemFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QuantityModal } from './components/QuantityModal';
import { ShoppingItemModal } from './components/ShoppingItemModal';
import { ConvertPurchasedModal } from './components/ConvertPurchasedModal';
import { AddFromInventoryModal } from './components/AddFromInventoryModal';
import { CreateEditListModal } from './components/CreateEditListModal';
import { DeleteListConfirmModal } from './components/DeleteListConfirmModal';
import {
  checkAndNotifyGroceries,
  getNotificationPermission,
  isNotificationPrefEnabled,
  isNotificationSupported,
  requestNotificationPermission,
  setNotificationPref,
  triggerTestNotification,
} from './utils/notifications';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'lists' | 'shopping' | 'budget' | 'inventory' | 'expiry' | 'archived' | 'settings'
  >('lists');

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingListItem[]>([]);
  const [shoppingBudget, setShoppingBudget] = useState<ShoppingBudgetSummary | null>(null);
  const [shoppingSuggestions, setShoppingSuggestions] = useState<LowStockSuggestion[]>([]);
  const [mlData, setMlData] = useState<MlRestockResponse | null>(null);
  const [mlLoading, setMlLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Inventory search, filter & sort states
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
  const [locationFilter, setLocationFilter] = useState<StorageLocation | ''>('');
  const [sortBy, setSortBy] = useState<'expiryDate' | 'name' | 'quantity'>('expiryDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Shopping list filter & sort states
  const [shoppingSearch, setShoppingSearch] = useState<string>('');
  const [shoppingCategoryFilter, setShoppingCategoryFilter] = useState<Category | ''>('');
  const [shoppingPriorityFilter, setShoppingPriorityFilter] = useState<ShoppingItemPriority | ''>('');
  const [shoppingSortBy, setShoppingSortBy] = useState<'name' | 'priority' | 'category'>('priority');
  const [shoppingSortDir, setShoppingSortDir] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GroceryItem | ShoppingListItem | null>(null);
  const [quantityModalState, setQuantityModalState] = useState<{
    item: GroceryItem | null;
    mode: QuantityActionType | null;
  }>({ item: null, mode: null });

  // Shopping Modals state
  const [isShoppingItemModalOpen, setIsShoppingItemModalOpen] = useState<boolean>(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingListItem | null>(null);
  const [convertingShoppingItem, setConvertingShoppingItem] = useState<ShoppingListItem | null>(null);
  const [addFromInventoryTarget, setAddFromInventoryTarget] = useState<
    GroceryItem | LowStockSuggestion | null
  >(null);

  // Multi-list state
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [isCreateEditListModalOpen, setIsCreateEditListModalOpen] = useState<boolean>(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [deletingList, setDeletingList] = useState<ShoppingList | null>(null);

  // Browser Notifications state
  const [notificationSupported] = useState<boolean>(() => isNotificationSupported());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getNotificationPermission());
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => isNotificationPrefEnabled()
  );

  const loadBackendData = useCallback(async (explicitListId?: number) => {
    setLoading(true);
    try {
      const listsRes = await inventoryApi.listShoppingLists(true);
      setShoppingLists(listsRes);

      const resolvedActiveId =
        explicitListId !== undefined
          ? explicitListId
          : activeListId && listsRes.some((l) => l.id === activeListId && !l.isArchived)
          ? activeListId
          : listsRes.find((l) => l.isDefault && !l.isArchived)?.id ?? listsRes[0]?.id ?? null;

      if (resolvedActiveId !== activeListId) {
        setActiveListId(resolvedActiveId);
      }

      const [healthRes, summaryRes, itemsRes, shoppingRes, budgetRes, suggestionsRes] =
        await Promise.all([
          inventoryApi.getHealth(),
          inventoryApi.getDashboardSummary(),
          inventoryApi.listItems({
            search,
            category: categoryFilter,
            storageLocation: locationFilter,
            sortBy,
            sortDir,
          }),
          inventoryApi.listShoppingItems({
            listId: resolvedActiveId ?? undefined,
            search: shoppingSearch,
            category: shoppingCategoryFilter,
            priority: shoppingPriorityFilter,
            sortBy: shoppingSortBy,
            sortDir: shoppingSortDir,
          }),
          inventoryApi.getShoppingBudget(resolvedActiveId ?? undefined),
          inventoryApi.getShoppingSuggestions(),
        ]);
      setHealth(healthRes);
      setSummary(summaryRes);
      setItems(itemsRes);
      setShoppingItems(shoppingRes);
      setShoppingBudget(budgetRes);
      setShoppingSuggestions(suggestionsRes);
      setBackendError(null);

      // Trigger Smart Restock ML prediction
      inventoryApi.getMlRestockPredictions(itemsRes).then((mlRes) => {
        setMlData(mlRes);
      }).catch(() => {
        // Handled inside inventoryApi
      });

      // Check and dispatch notifications if enabled
      if (isNotificationPrefEnabled() && getNotificationPermission() === 'granted') {
        checkAndNotifyGroceries(summaryRes.expiredItems, summaryRes.expiringTodayItems);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      } else {
        setBackendError(
          'Unable to synchronize with the Smart List backend. Check if the server is running.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    activeListId,
    search,
    categoryFilter,
    locationFilter,
    sortBy,
    sortDir,
    shoppingSearch,
    shoppingCategoryFilter,
    shoppingPriorityFilter,
    shoppingSortBy,
    shoppingSortDir,
  ]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const handleRefreshMl = async () => {
    setMlLoading(true);
    try {
      const mlRes = await inventoryApi.getMlRestockPredictions(items);
      setMlData(mlRes);
      showTransientFeedback('Smart Restock ML model re-scored successfully.');
    } catch {
      showTransientFeedback('Failed to re-score ML predictions.');
    } finally {
      setMlLoading(false);
    }
  };

  const handleAddMlSuggestion = async (pred: MlRestockPrediction) => {
    try {
      const priority: ShoppingItemPriority =
        pred.urgency === 'URGENT' ? 'URGENT' : pred.urgency === 'HIGH' ? 'HIGH' : 'MEDIUM';
      const created = await inventoryApi.createShoppingItem({
        name: pred.name,
        category: pred.category,
        quantity: 1,
        unit: pred.unit,
        priority,
        shoppingListId: activeListId ?? undefined,
        notes: `Smart Restock ML: ${pred.reasoning}`,
      });
      showTransientFeedback(`Queued "${created.name}" onto your active shopping list.`);
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };


  const showTransientFeedback = (msg: string) => {
    setActionFeedback(msg);
    window.setTimeout(() => {
      setActionFeedback((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleToggleNotifications = async () => {
    if (!notificationSupported) return;
    if (notificationsEnabled) {
      setNotificationPref(false);
      setNotificationsEnabled(false);
      showTransientFeedback('Freshness browser alerts disabled.');
    } else {
      const result = await requestNotificationPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        setNotificationsEnabled(true);
        showTransientFeedback(
          'Freshness notifications enabled. Alerts will trigger while this tab is active.'
        );
        if (summary) {
          checkAndNotifyGroceries(summary.expiredItems, summary.expiringTodayItems);
        }
      } else if (result === 'denied') {
        setNotificationsEnabled(false);
        showTransientFeedback(
          'Notification permission was blocked in browser settings. Please enable them in your site permissions.'
        );
      }
    }
  };

  const handleSendTestNotification = () => {
    const success = triggerTestNotification();
    if (success) {
      showTransientFeedback('Test notification sent.');
    } else {
      showTransientFeedback('Unable to send test notification. Check permissions.');
    }
  };

  // Inventory Handlers
  const handleSaveItem = async (payload: GroceryItemPayload, editId?: number) => {
    if (editId != null) {
      const updated = await inventoryApi.updateItem(editId, payload);
      showTransientFeedback(`Updated "${updated.productName}" in pantry inventory.`);
    } else {
      const created = await inventoryApi.createItem(payload);
      showTransientFeedback(`Added "${created.productName}" to pantry inventory.`);
    }
    await loadBackendData();
  };

  const handleDeleteConfirm = async (id: number) => {
    if (!deletingItem) return;
    if ('productName' in deletingItem) {
      await inventoryApi.deleteItem(id);
      showTransientFeedback(`Removed "${deletingItem.productName}" from pantry inventory.`);
    } else {
      await inventoryApi.deleteShoppingItem(id);
      showTransientFeedback(`Removed "${deletingItem.name}" from shopping list.`);
    }
    await loadBackendData();
  };

  const handleAdjustQuantity = async (
    id: number,
    action: QuantityActionType,
    amount?: number
  ) => {
    try {
      const updated = await inventoryApi.adjustQuantity(id, action, amount);
      showTransientFeedback(
        `Updated "${updated.productName}" quantity to ${updated.quantity} ${updated.unit}.`
      );
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
        throw err;
      }
      throw err;
    }
  };

  // Shopping List Handlers
  const handleSaveShoppingItem = async (
    payload: ShoppingListItemPayload,
    editId?: number
  ) => {
    const itemPayload: ShoppingListItemPayload = {
      ...payload,
      shoppingListId: payload.shoppingListId ?? activeListId ?? undefined,
    };
    if (editId != null) {
      const updated = await inventoryApi.updateShoppingItem(editId, itemPayload);
      showTransientFeedback(`Updated "${updated.name}" in shopping list.`);
    } else {
      const created = await inventoryApi.createShoppingItem(itemPayload);
      showTransientFeedback(`Added "${created.name}" to shopping list.`);
    }
    await loadBackendData();
  };

  const handleToggleShoppingPurchased = async (item: ShoppingListItem) => {
    try {
      const updated = await inventoryApi.toggleShoppingItemPurchased(item.id, !item.purchased);
      showTransientFeedback(
        updated.purchased
          ? `Marked "${updated.name}" as purchased. Click "Restock to Pantry" when unpacking.`
          : `Unchecked "${updated.name}". Moved back to To-Buy checklist.`
      );
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };

  const handleClearPurchased = async () => {
    const purchasedCount = shoppingItems.filter((i) => i.purchased).length;
    if (purchasedCount === 0) return;
    const activeList = shoppingLists.find((l) => l.id === activeListId);
    const listName = activeList ? activeList.title : 'shopping list';
    if (
      window.confirm(
        `Are you sure you want to clear ${purchasedCount} purchased item(s) from "${listName}"?`
      )
    ) {
      const removed = await inventoryApi.clearPurchasedShoppingItems(activeListId ?? undefined);
      showTransientFeedback(`Cleared ${removed.clearedCount} purchased item(s).`);
      await loadBackendData();
    }
  };

  const handleConfirmConvertPurchased = async (
    shoppingItemId: number,
    payload: ConvertPurchasedPayload
  ) => {
    const fridgeItem = await inventoryApi.convertPurchasedToInventory(shoppingItemId, payload);
    showTransientFeedback(
      `Restocked "${fridgeItem.productName}" in pantry (${fridgeItem.quantity} ${fridgeItem.unit} total).`
    );
    await loadBackendData();
  };

  const handleConfirmAddFromInventory = async (
    inventoryItemId: number,
    quantityToBuy: number,
    priority: ShoppingItemPriority
  ) => {
    const item = await inventoryApi.addShoppingItemFromInventory(
      inventoryItemId,
      quantityToBuy,
      priority,
      activeListId ?? undefined
    );
    showTransientFeedback(
      `Queued ${item.quantity} ${item.unit} of "${item.name}" on shopping list.`
    );
    await loadBackendData();
  };

  // Multi-List Handlers
  const handleSelectList = (listId: number) => {
    setActiveListId(listId);
  };

  const handleSaveList = async (payload: ShoppingListPayload) => {
    try {
      if (editingList) {
        const updated = await inventoryApi.updateShoppingList(editingList.id, payload);
        showTransientFeedback(`Updated list "${updated.title}".`);
      } else {
        const created = await inventoryApi.createShoppingList(payload);
        showTransientFeedback(`Created new list "${created.title}".`);
        setActiveListId(created.id);
      }
      setIsCreateEditListModalOpen(false);
      setEditingList(null);
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };

  const handleArchiveList = async (list: ShoppingList) => {
    if (list.isDefault) {
      showTransientFeedback('The default list cannot be archived.');
      return;
    }
    try {
      await inventoryApi.archiveShoppingList(list.id);
      showTransientFeedback(`Archived list "${list.title}".`);
      if (activeListId === list.id) {
        const defaultList = shoppingLists.find((l) => l.isDefault && !l.isArchived);
        if (defaultList) setActiveListId(defaultList.id);
      }
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };

  const handleRestoreList = async (list: ShoppingList) => {
    try {
      await inventoryApi.restoreShoppingList(list.id);
      showTransientFeedback(`Restored list "${list.title}".`);
      setActiveListId(list.id);
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };

  const handleDeleteList = (list: ShoppingList) => {
    setDeletingList(list);
  };

  const handleConfirmDeleteList = async () => {
    if (!deletingList) return;
    const listToDelete = deletingList;
    try {
      await inventoryApi.deleteShoppingList(listToDelete.id);
      showTransientFeedback(`Deleted list "${listToDelete.title}".`);
      setDeletingList(null);
      if (activeListId === listToDelete.id) {
        const defaultList = shoppingLists.find(
          (l) => l.isDefault && l.id !== listToDelete.id && !l.isArchived
        );
        if (defaultList) setActiveListId(defaultList.id);
      }
      await loadBackendData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setBackendError(err.message);
      }
    }
  };




  const uncheckedShoppingCount = shoppingItems.filter((i) => !i.purchased).length;
  const expiryAlertsCount =
    (summary?.expiredCount ?? 0) +
    (summary?.expiringTodayCount ?? 0) +
    (summary?.expiringSoonCount ?? 0);

  return (
    <div
      data-testid="dashboard-view"
      className="min-h-screen bg-surface-page text-text-primary flex flex-col md:flex-row font-sans transition-colors duration-150"
    >
      {/* Mobile Top Header (Sticky) */}
      <header className="md:hidden sticky top-0 z-40 bg-surface-primary border-b border-border-default px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-brand-primary text-brand-text flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            SL
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-text-primary leading-tight">Smart List</h1>
            <p className="text-[12px] text-text-secondary leading-none mt-0.5">Grocery & Household</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <button
            type="button"
            data-testid="sidebar-quick-add-btn"
            onClick={() => {
              if (activeTab === 'inventory') {
                setEditingItem(null);
                setIsItemModalOpen(true);
              } else {
                setEditingShoppingItem(null);
                setIsShoppingItemModalOpen(true);
              }
            }}
            className="h-[36px] px-3.5 rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </header>

      {/* Mobile Horizontal Tab Navigation (Sticky below header) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden sticky top-[57px] z-30 bg-surface-secondary border-b border-border-default px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
      >
        <button
          type="button"
          data-testid="nav-dashboard-btn"
          onClick={() => setActiveTab('dashboard')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          data-testid="nav-lists-btn"
          onClick={() => setActiveTab('lists')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'lists'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>My Lists</span>
        </button>

        <button
          type="button"
          data-testid="nav-shopping-btn"
          onClick={() => setActiveTab('shopping')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'shopping'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shopping</span>
          {uncheckedShoppingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-primary text-[11px] font-semibold border border-border-default">
              {uncheckedShoppingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="nav-inventory-btn"
          onClick={() => setActiveTab('inventory')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Inventory</span>
        </button>

        <button
          type="button"
          data-testid="nav-budget-btn"
          onClick={() => setActiveTab('budget')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'budget'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Budget</span>
        </button>

        <button
          type="button"
          data-testid="nav-expiry-btn"
          onClick={() => setActiveTab('expiry')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'expiry'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Expiry</span>
          {expiryAlertsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-warning-subtle text-warning-text border border-warning-border text-[11px] font-semibold">
              {expiryAlertsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="nav-archived-btn"
          onClick={() => setActiveTab('archived')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archived</span>
        </button>

        <button
          type="button"
          data-testid="nav-settings-btn"
          onClick={() => setActiveTab('settings')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] transition-colors duration-150 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-surface-primary text-text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary font-medium'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Desktop Sidebar Navigation (Fixed 232px) */}
      <aside
        data-testid="sidebar-nav"
        className="hidden md:flex w-[232px] shrink-0 bg-surface-primary border-r border-border-default min-h-screen flex-col justify-between p-4 transition-colors"
      >
        <div className="space-y-5">
          {/* Brand Lockup */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-[6px] bg-brand-primary text-brand-text flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              SL
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-text-primary tracking-tight leading-tight">
                Smart List
              </h2>
              <p className="text-[12px] text-text-secondary leading-none mt-0.5">
                Grocery & Household
              </p>
            </div>
          </div>

          {/* Primary Quick Add CTA Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'inventory') {
                setEditingItem(null);
                setIsItemModalOpen(true);
              } else {
                setEditingShoppingItem(null);
                setIsShoppingItemModalOpen(true);
              }
            }}
            className="w-full h-[40px] rounded-[6px] bg-brand-primary hover:bg-brand-hover text-brand-text font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'inventory' ? 'Add Pantry Item' : 'New Shopping Item'}</span>
          </button>

          {/* Navigation Rail Links */}
          <nav aria-label="Main Navigation" className="flex flex-col gap-1">
            <button
              type="button"
              data-testid="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-lists-btn"
              onClick={() => setActiveTab('lists')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'lists'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ListChecks className="w-4 h-4 shrink-0" />
                <span>My Lists</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary text-[12px] font-medium border border-border-default">
                {shoppingLists.filter((l) => !l.isArchived).length}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-shopping-btn"
              onClick={() => setActiveTab('shopping')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'shopping'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Shopping List</span>
              </span>
              {uncheckedShoppingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-text-primary text-[12px] font-semibold border border-border-default">
                  {uncheckedShoppingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="nav-inventory-btn"
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Inventory</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary text-[12px] font-medium border border-border-default">
                {summary?.totalInventoryCount ?? items.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-budget-btn"
              onClick={() => setActiveTab('budget')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Budget & Costs</span>
              </span>
              {shoppingBudget && shoppingBudget.uncheckedEstimatedTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-success-subtle text-success-text text-[12px] font-semibold border border-success-border">
                  ₹{shoppingBudget.uncheckedEstimatedTotal.toFixed(0)}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="nav-expiry-btn"
              onClick={() => setActiveTab('expiry')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'expiry'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Freshness Alerts</span>
              </span>
              {expiryAlertsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-warning-subtle text-warning-text border border-warning-border text-[12px] font-semibold">
                  {expiryAlertsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="nav-archived-btn"
              onClick={() => setActiveTab('archived')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 shrink-0" />
                <span>Archived Lists</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary text-[12px] font-medium border border-border-default">
                {shoppingLists.filter((l) => l.isArchived).length}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] leading-[20px] transition-colors duration-150 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-surface-secondary text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: System Status & Theme Toggle */}
        <div className="pt-4 border-t border-border-default space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="rounded-[6px] bg-surface-secondary border border-border-default px-2.5 py-1.5 flex items-center gap-2 grow">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  health?.status === 'UP' && !backendError ? 'bg-success-primary' : 'bg-warning-primary'
                }`}
              />
              <span className="text-text-secondary font-medium text-[11px] truncate">
                {health?.status === 'UP' && !backendError ? 'H2 Database' : 'Offline'}
              </span>
            </div>
            <ThemeToggle variant="compact" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
        {/* Backend Error Banner */}
        {backendError && (
          <div
            data-testid="backend-error-banner"
            className="rounded-[10px] border border-red-200 bg-danger-subtle p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-danger-primary shadow-card"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-bold">Backend Synchronization Issue</p>
                <p className="text-[12px] text-danger-primary/90 mt-0.5">{backendError}</p>
              </div>
            </div>
            <button
              type="button"
              data-testid="backend-retry-btn"
              onClick={() => {
                loadBackendData();
              }}
              className="h-[36px] px-3 rounded-[6px] bg-[#A12D2D] hover:bg-red-800 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Transient Action Confirmation Toast */}
        {actionFeedback && !backendError && (
          <div
            data-testid="action-feedback-banner"
            className="fixed bottom-6 right-6 z-50 rounded-[10px] bg-surface-inverse text-white px-4 py-3 text-[13px] font-medium shadow-popover flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-text-muted hover:text-white ml-2 text-[12px] font-semibold cursor-pointer underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 0: Overview Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            loading={loading}
            mlData={mlData}
            mlLoading={mlLoading}
            onAddMlSuggestion={handleAddMlSuggestion}
            onRefreshMl={handleRefreshMl}
            onRefresh={loadBackendData}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={(item) => setDeletingItem(item)}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onNavigateToShoppingList={() => setActiveTab('shopping')}
            onQuickAdjust={handleAdjustQuantity}
            onToggleShoppingPurchased={handleToggleShoppingPurchased}
            onAddSuggestionToShoppingList={(suggestion) => setAddFromInventoryTarget(suggestion)}
            notificationSupported={notificationSupported}
            notificationPermission={notificationPermission}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onSendTestNotification={handleSendTestNotification}
          />
        )}

        {/* Section 1: My Lists (Primary Landing Page) */}
        {activeTab === 'lists' && (
          <MyListsView
            lists={shoppingLists}
            activeListId={activeListId}
            onSelectList={handleSelectList}
            shoppingItems={shoppingItems}
            budget={shoppingBudget}
            summary={summary}
            loading={loading}
            onRefresh={loadBackendData}
            onOpenShoppingList={() => setActiveTab('shopping')}
            onOpenInventory={() => setActiveTab('inventory')}
            onAddSuggestion={(suggestion) => setAddFromInventoryTarget(suggestion)}
            onRequestCreateList={() => {
              setEditingList(null);
              setIsCreateEditListModalOpen(true);
            }}
            onEditList={(list) => {
              setEditingList(list);
              setIsCreateEditListModalOpen(true);
            }}
            onArchiveList={handleArchiveList}
            onRestoreList={handleRestoreList}
            onDeleteList={handleDeleteList}
          />
        )}

        {/* Section 2: Shopping (Checklist & Purchase Workflow) */}
        {activeTab === 'shopping' && (
          <ShoppingListView
            lists={shoppingLists.filter((l) => !l.isArchived)}
            activeList={shoppingLists.find((l) => l.id === activeListId) ?? null}
            onSelectList={handleSelectList}
            onOpenCreateListModal={() => {
              setEditingList(null);
              setIsCreateEditListModalOpen(true);
            }}
            onEditList={(list) => {
              setEditingList(list);
              setIsCreateEditListModalOpen(true);
            }}
            onArchiveList={handleArchiveList}
            onDeleteList={handleDeleteList}
            items={shoppingItems}
            budget={shoppingBudget}
            suggestions={shoppingSuggestions}
            mlData={mlData}
            mlLoading={mlLoading}
            onAddMlSuggestion={handleAddMlSuggestion}
            onRefreshMl={handleRefreshMl}
            loading={loading}
            search={shoppingSearch}
            categoryFilter={shoppingCategoryFilter}
            priorityFilter={shoppingPriorityFilter}
            sortBy={shoppingSortBy}
            sortDir={shoppingSortDir}
            onSearchChange={setShoppingSearch}
            onCategoryFilterChange={setShoppingCategoryFilter}
            onPriorityFilterChange={setShoppingPriorityFilter}
            onSortByChange={setShoppingSortBy}
            onSortDirToggle={() =>
              setShoppingSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            onResetFilters={() => {
              setShoppingSearch('');
              setShoppingCategoryFilter('');
              setShoppingPriorityFilter('');
              setShoppingSortBy('priority');
              setShoppingSortDir('asc');
            }}
            onRefresh={loadBackendData}
            onOpenAddModal={() => {
              setEditingShoppingItem(null);
              setIsShoppingItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingShoppingItem(item);
              setIsShoppingItemModalOpen(true);
            }}
            onDeleteItem={(item) => setDeletingItem(item)}
            onTogglePurchased={handleToggleShoppingPurchased}
            onClearPurchased={handleClearPurchased}
            onConvertPurchased={(item) => setConvertingShoppingItem(item)}
            onAddSuggestion={(suggestion) => setAddFromInventoryTarget(suggestion)}
          />
        )}

        {/* Section 3: Budget (Spending Estimates) */}
        {activeTab === 'budget' && (
          <BudgetView
            budget={shoppingBudget}
            items={shoppingItems}
            loading={loading}
            onRefresh={loadBackendData}
            onEditItem={(item) => {
              setEditingShoppingItem(item);
              setIsShoppingItemModalOpen(true);
            }}
            onNavigateToShopping={() => setActiveTab('shopping')}
          />
        )}

        {/* Section 4: Inventory (Pantry Stock Management) */}
        {activeTab === 'inventory' && (
          <InventoryView
            items={items}
            loading={loading}
            search={search}
            categoryFilter={categoryFilter}
            locationFilter={locationFilter}
            sortBy={sortBy}
            sortDir={sortDir}
            onSearchChange={setSearch}
            onCategoryFilterChange={setCategoryFilter}
            onLocationFilterChange={setLocationFilter}
            onSortByChange={setSortBy}
            onSortDirToggle={() =>
              setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            onResetFilters={() => {
              setSearch('');
              setCategoryFilter('');
              setLocationFilter('');
              setSortBy('expiryDate');
              setSortDir('asc');
            }}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            onOpenEditModal={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onOpenDeleteModal={(item) => setDeletingItem(item)}
            onOpenQuantityModal={(item, mode) =>
              setQuantityModalState({ item, mode })
            }
            onQuickFinish={(item) => handleAdjustQuantity(item.id, 'FINISH')}
            onAddToShoppingList={(item) => setAddFromInventoryTarget(item)}
          />
        )}

        {/* Section 5: Expiry & Alerts */}
        {activeTab === 'expiry' && (
          <ExpiryAlertsView
            summary={summary}
            loading={loading}
            onRefresh={loadBackendData}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={(item) => setDeletingItem(item)}
            onQuickAdjust={handleAdjustQuantity}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onAddGroceryToShoppingList={(item) => setAddFromInventoryTarget(item)}
            notificationSupported={notificationSupported}
            notificationPermission={notificationPermission}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onSendTestNotification={handleSendTestNotification}
          />
        )}

        {/* Section 6: Settings */}
        {activeTab === 'settings' && (
          <SettingsView
            health={health}
            backendError={backendError}
            onRefreshHealth={loadBackendData}
            notificationSupported={notificationSupported}
            notificationPermission={notificationPermission}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onSendTestNotification={handleSendTestNotification}
          />
        )}
      </main>

      {/* Inventory Modals */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        initialItem={editingItem}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
      />

      <DeleteConfirmModal
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
      />

      <QuantityModal
        item={quantityModalState.item}
        mode={quantityModalState.mode}
        onClose={() => setQuantityModalState({ item: null, mode: null })}
        onConfirm={handleAdjustQuantity}
      />

      {/* Shopping List Modals */}
      <ShoppingItemModal
        isOpen={isShoppingItemModalOpen}
        initialItem={editingShoppingItem}
        lists={shoppingLists.filter((l) => !l.isArchived)}
        activeListId={activeListId}
        onClose={() => {
          setIsShoppingItemModalOpen(false);
          setEditingShoppingItem(null);
        }}
        onSubmit={handleSaveShoppingItem}
      />

      <ConvertPurchasedModal
        item={convertingShoppingItem}
        onClose={() => setConvertingShoppingItem(null)}
        onConfirm={handleConfirmConvertPurchased}
      />

      <AddFromInventoryModal
        groceryItem={addFromInventoryTarget}
        onClose={() => setAddFromInventoryTarget(null)}
        onConfirm={handleConfirmAddFromInventory}
      />

      {/* Create & Edit List Modal */}
      <CreateEditListModal
        isOpen={isCreateEditListModalOpen}
        editingList={editingList}
        onClose={() => {
          setIsCreateEditListModalOpen(false);
          setEditingList(null);
        }}
        onSubmit={handleSaveList}
      />

      {/* Delete List Confirmation Modal */}
      <DeleteListConfirmModal
        isOpen={deletingList !== null}
        list={deletingList}
        onClose={() => setDeletingList(null)}
        onConfirmDelete={handleConfirmDeleteList}
        onArchiveInstead={async () => {
          if (deletingList) {
            const target = deletingList;
            setDeletingList(null);
            await handleArchiveList(target);
          }
        }}
      />

    </div>
  );
}
