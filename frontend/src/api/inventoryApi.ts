import type {
  Category,
  ConvertPurchasedPayload,
  DashboardSummary,
  ExpiryStatus,
  GroceryItem,
  GroceryItemPayload,
  HealthStatus,
  LowStockSuggestion,
  QuantityActionType,
  ShoppingBudgetSummary,
  ShoppingItemPriority,
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemPayload,
  ShoppingListPayload,
  StorageLocation,
} from '../types/inventory';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export class ApiError extends Error {
  public readonly status: number;
  public readonly fieldErrors?: Record<string, string>;
  public readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch {
    throw new ApiError(
      `Unable to reach the Smart Fridge backend at ${API_BASE_URL}. Ensure the Spring Boot server is running.`,
      0,
      undefined,
      true
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorObj = (data ?? {}) as {
      message?: string;
      error?: string;
      fieldErrors?: Record<string, string>;
    };
    const msg =
      errorObj.message ||
      errorObj.error ||
      `Backend request failed with HTTP ${response.status}`;
    throw new ApiError(msg, response.status, errorObj.fieldErrors, false);
  }

  return data as T;
}

export interface InventoryQueryParams {
  search?: string;
  category?: Category | '';
  storageLocation?: StorageLocation | '';
  sortBy?: 'expiryDate' | 'name' | 'quantity';
  sortDir?: 'asc' | 'desc';
}

export interface ShoppingListQueryParams {
  listId?: number;
  search?: string;
  category?: Category | '';
  priority?: ShoppingItemPriority | '';
  purchased?: boolean;
  sortBy?: 'name' | 'priority' | 'category';
  sortDir?: 'asc' | 'desc';
}

export const inventoryApi = {
  getHealth(): Promise<HealthStatus> {
    return requestJson<HealthStatus>('/api/health');
  },

  getDashboardSummary(): Promise<DashboardSummary> {
    return requestJson<DashboardSummary>('/api/inventory/dashboard');
  },

  listByExpiry(status?: ExpiryStatus): Promise<GroceryItem[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return requestJson<GroceryItem[]>(`/api/inventory/expiry${query}`);
  },

  listItems(params: InventoryQueryParams = {}): Promise<GroceryItem[]> {
    const searchParams = new URLSearchParams();
    if (params.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params.category) {
      searchParams.set('category', params.category);
    }
    if (params.storageLocation) {
      searchParams.set('storageLocation', params.storageLocation);
    }
    if (params.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortDir) {
      searchParams.set('sortDir', params.sortDir);
    }
    const queryString = searchParams.toString();
    return requestJson<GroceryItem[]>(
      `/api/inventory${queryString ? `?${queryString}` : ''}`
    );
  },

  createItem(payload: GroceryItemPayload): Promise<GroceryItem> {
    return requestJson<GroceryItem>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateItem(id: number, payload: GroceryItemPayload): Promise<GroceryItem> {
    return requestJson<GroceryItem>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adjustQuantity(
    id: number,
    action: QuantityActionType,
    amount?: number
  ): Promise<GroceryItem> {
    return requestJson<GroceryItem>(`/api/inventory/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ action, amount }),
    });
  },

  deleteItem(id: number): Promise<void> {
    return requestJson<void>(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Multi-List Management APIs
  listShoppingLists(includeArchived = false): Promise<ShoppingList[]> {
    const q = includeArchived ? '?includeArchived=true' : '';
    return requestJson<ShoppingList[]>(`/api/shopping-lists${q}`);
  },

  getShoppingList(id: number): Promise<ShoppingList> {
    return requestJson<ShoppingList>(`/api/shopping-lists/${id}`);
  },

  createShoppingList(payload: ShoppingListPayload): Promise<ShoppingList> {
    return requestJson<ShoppingList>('/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateShoppingList(id: number, payload: ShoppingListPayload): Promise<ShoppingList> {
    return requestJson<ShoppingList>(`/api/shopping-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  archiveShoppingList(id: number): Promise<ShoppingList> {
    return requestJson<ShoppingList>(`/api/shopping-lists/${id}/archive`, {
      method: 'PATCH',
    });
  },

  restoreShoppingList(id: number): Promise<ShoppingList> {
    return requestJson<ShoppingList>(`/api/shopping-lists/${id}/restore`, {
      method: 'PATCH',
    });
  },

  deleteShoppingList(id: number): Promise<void> {
    return requestJson<void>(`/api/shopping-lists/${id}`, {
      method: 'DELETE',
    });
  },

  // Shopping List Items APIs
  listShoppingItems(params: ShoppingListQueryParams = {}): Promise<ShoppingListItem[]> {
    const searchParams = new URLSearchParams();
    if (params.listId) {
      searchParams.set('listId', String(params.listId));
    }
    if (params.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params.category) {
      searchParams.set('category', params.category);
    }
    if (params.priority) {
      searchParams.set('priority', params.priority);
    }
    if (params.purchased !== undefined) {
      searchParams.set('purchased', String(params.purchased));
    }
    if (params.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortDir) {
      searchParams.set('sortDir', params.sortDir);
    }
    const q = searchParams.toString();
    return requestJson<ShoppingListItem[]>(`/api/shopping-list${q ? `?${q}` : ''}`);
  },

  createShoppingItem(payload: ShoppingListItemPayload): Promise<ShoppingListItem> {
    return requestJson<ShoppingListItem>('/api/shopping-list', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateShoppingItem(id: number, payload: ShoppingListItemPayload): Promise<ShoppingListItem> {
    return requestJson<ShoppingListItem>(`/api/shopping-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  toggleShoppingItemPurchased(id: number, purchased?: boolean): Promise<ShoppingListItem> {
    return requestJson<ShoppingListItem>(`/api/shopping-list/${id}/purchased`, {
      method: 'PATCH',
      body: JSON.stringify(purchased !== undefined ? { purchased } : {}),
    });
  },

  deleteShoppingItem(id: number): Promise<void> {
    return requestJson<void>(`/api/shopping-list/${id}`, {
      method: 'DELETE',
    });
  },

  clearPurchasedShoppingItems(listId?: number): Promise<{ clearedCount: number }> {
    const q = listId ? `?listId=${listId}` : '';
    return requestJson<{ clearedCount: number }>(`/api/shopping-list/purchased${q}`, {
      method: 'DELETE',
    });
  },

  getShoppingBudget(listId?: number): Promise<ShoppingBudgetSummary> {
    const q = listId ? `?listId=${listId}` : '';
    return requestJson<ShoppingBudgetSummary>(`/api/shopping-list/budget${q}`);
  },

  getShoppingSuggestions(): Promise<LowStockSuggestion[]> {
    return requestJson<LowStockSuggestion[]>('/api/shopping-list/suggestions');
  },

  addShoppingItemFromInventory(
    inventoryItemId: number,
    quantityToBuy: number,
    priority?: ShoppingItemPriority,
    shoppingListId?: number
  ): Promise<ShoppingListItem> {
    return requestJson<ShoppingListItem>(`/api/shopping-list/from-inventory/${inventoryItemId}`, {
      method: 'POST',
      body: JSON.stringify({ quantityToBuy, priority, shoppingListId }),
    });
  },

  convertPurchasedToInventory(
    shoppingItemId: number,
    payload?: ConvertPurchasedPayload
  ): Promise<GroceryItem> {
    return requestJson<GroceryItem>(`/api/shopping-list/${shoppingItemId}/convert-to-inventory`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async getMlRestockPredictions(items: GroceryItem[]): Promise<import('../types/inventory').MlRestockResponse> {
    try {
      const res = await requestJson<import('../types/inventory').MlRestockResponse>('/api/ml/suggestions');
      return res;
    } catch {
      try {
        const payload = items.map((it) => ({
          id: it.id,
          name: it.productName,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          targetQuantity: it.minimumStockThreshold * 2,
          daysSinceRestock: 4.0,
          purchaseCount: 3,
        }));
        const res = await fetch('http://localhost:8082/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payload }),
        });
        if (!res.ok) throw new Error('ML service error');
        return await res.json();
      } catch {
        return {
          coldStart: items.length < 3,
          cold_start: items.length < 3,
          totalAnalyzed: items.length,
          total_analyzed: items.length,
          message:
            items.length < 3
              ? 'Smart Restock needs at least 3 active pantry items to learn consumption cadence. Add your common household staples to activate ML predictions.'
              : 'ML Predictor microservice is calibrating in background.',
          suggestions: [],
        };
      }
    }
  },
};

