export type Category =
  | 'DAIRY'
  | 'PRODUCE'
  | 'MEAT_SEAFOOD'
  | 'BEVERAGES'
  | 'BAKERY'
  | 'DELI_PREPARED'
  | 'PANTRY'
  | 'FROZEN'
  | 'CONDIMENTS'
  | 'OTHER';

export type StorageLocation =
  | 'UPPER_SHELF'
  | 'MIDDLE_SHELF'
  | 'LOWER_SHELF'
  | 'CRISPER_DRAWER'
  | 'DOOR_BIN'
  | 'FREEZER'
  | 'PANTRY';

export type ExpirySource = 'CONFIRMED' | 'ESTIMATED';

export type ExpiryStatus =
  | 'EXPIRED'
  | 'EXPIRES_TODAY'
  | 'EXPIRING_SOON'
  | 'FRESH'
  | 'NO_EXPIRY';

export type QuantityActionType = 'USE' | 'FINISH' | 'RESTOCK' | 'CORRECT';

export type ShoppingItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface GroceryItem {
  id: number;
  productName: string;
  category: Category;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  minimumStockThreshold: number;
  purchaseDate: string;
  expiryDate?: string | null;
  expirySource?: ExpirySource | null;
  price?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry?: number | null;
  expiryStatus: ExpiryStatus;
  lowStock: boolean;
}

export interface GroceryItemPayload {
  productName: string;
  category: Category;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  minimumStockThreshold: number;
  purchaseDate: string;
  expiryDate?: string | null;
  expirySource?: ExpirySource | null;
  price?: number | null;
  notes?: string | null;
}

export interface ShoppingList {
  id: number;
  title: string;
  color: string;
  icon: string;
  isArchived: boolean;
  isDefault: boolean;
  itemCount: number;
  uncheckedItemCount: number;
  estimatedTotal: number;
  createdAt: string;
  updatedAt: string;
  items?: ShoppingListItem[] | null;
}

export interface ShoppingListPayload {
  title: string;
  color?: string;
  icon?: string;
}

export interface ShoppingListItem {
  id: number;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  estimatedPrice?: number | null;
  purchased: boolean;
  priority: ShoppingItemPriority;
  notes?: string | null;
  inventoryItemId?: number | null;
  shoppingListId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItemPayload {
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  estimatedPrice?: number | null;
  priority?: ShoppingItemPriority;
  notes?: string | null;
  inventoryItemId?: number | null;
  shoppingListId?: number;
}

export interface ShoppingBudgetSummary {
  uncheckedEstimatedTotal: number;
  uncheckedItemsWithPriceCount: number;
  uncheckedItemsWithoutPriceCount: number;
  checkedEstimatedTotal: number;
  checkedItemsWithPriceCount: number;
  checkedItemsWithoutPriceCount: number;
  totalUncheckedCount: number;
  totalCheckedCount: number;
}

export interface LowStockSuggestion {
  inventoryItemId: number;
  name: string;
  category: Category;
  currentQuantity: number;
  minimumStockThreshold: number;
  suggestedQuantity: number;
  unit: string;
  estimatedPrice?: number | null;
  alreadyInShoppingList: boolean;
}

export interface ConvertPurchasedPayload {
  storageLocation?: StorageLocation;
  purchaseDate?: string;
  expiryDate?: string | null;
  expirySource?: ExpirySource | null;
  minimumStockThreshold?: number;
  notes?: string | null;
  removeFromShoppingList?: boolean;
}

export interface DashboardSummary {
  totalInventoryCount: number;
  expiredCount: number;
  expiringTodayCount: number;
  expiringSoonCount: number;
  lowStockCount: number;
  shoppingListCount: number;
  recentlyUpdatedGroceries: GroceryItem[];
  expiredItems: GroceryItem[];
  expiringTodayItems: GroceryItem[];
  expiringSoonItems: GroceryItem[];
  upcomingShoppingList: ShoppingListItem[];
  lowStockSuggestions: LowStockSuggestion[];
  budgetSummary?: ShoppingBudgetSummary;
}

export interface HealthStatus {
  status: string;
  service: string;
  activeProfiles?: string[];
  database?: string;
  timestamp?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  DAIRY: 'Dairy & Eggs',
  PRODUCE: 'Fresh Produce',
  MEAT_SEAFOOD: 'Meat & Seafood',
  BEVERAGES: 'Beverages',
  BAKERY: 'Bakery',
  DELI_PREPARED: 'Deli & Prepared',
  PANTRY: 'Pantry',
  FROZEN: 'Frozen',
  CONDIMENTS: 'Condiments & Sauces',
  OTHER: 'Other',
};

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  UPPER_SHELF: 'Upper Shelf',
  MIDDLE_SHELF: 'Middle Shelf',
  LOWER_SHELF: 'Lower Shelf',
  CRISPER_DRAWER: 'Crisper Drawer',
  DOOR_BIN: 'Door Bin',
  FREEZER: 'Freezer Compartment',
  PANTRY: 'Dry Pantry',
};

export const EXPIRY_SOURCE_LABELS: Record<ExpirySource, string> = {
  CONFIRMED: 'Confirmed Label',
  ESTIMATED: 'Estimated Window',
};

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  EXPIRED: 'Expired',
  EXPIRES_TODAY: 'Expires Today',
  EXPIRING_SOON: 'Expiring Soon',
  FRESH: 'Fresh',
  NO_EXPIRY: 'No Expiry Date',
};

export const SHOPPING_PRIORITY_LABELS: Record<ShoppingItemPriority, string> = {
  LOW: 'Low Priority',
  MEDIUM: 'Medium Priority',
  HIGH: 'High Priority',
  URGENT: 'Urgent Priority',
};

export interface PaletteColor {
  hex: string;
  label: string;
  bgClass: string;
  textClass: string;
}

export const RESTRAINED_LIST_COLORS: PaletteColor[] = [
  { hex: '#0b292f', label: 'Deep Teal', bgClass: 'bg-[#0b292f]', textClass: 'text-white' },
  { hex: '#0d9488', label: 'Mint Sage', bgClass: 'bg-[#0d9488]', textClass: 'text-white' },
  { hex: '#059669', label: 'Emerald', bgClass: 'bg-[#059669]', textClass: 'text-white' },
  { hex: '#d97706', label: 'Warm Amber', bgClass: 'bg-[#d97706]', textClass: 'text-white' },
  { hex: '#dc2626', label: 'Crimson', bgClass: 'bg-[#dc2626]', textClass: 'text-white' },
  { hex: '#7c3aed', label: 'Violet', bgClass: 'bg-[#7c3aed]', textClass: 'text-white' },
  { hex: '#4f46e5', label: 'Indigo', bgClass: 'bg-[#4f46e5]', textClass: 'text-white' },
  { hex: '#0284c7', label: 'Sky Blue', bgClass: 'bg-[#0284c7]', textClass: 'text-white' },
];

export interface PaletteIcon {
  id: string;
  label: string;
}

export const RESTRAINED_LIST_ICONS: PaletteIcon[] = [
  { id: 'shopping-bag', label: 'Shopping Bag' },
  { id: 'sparkles', label: 'Special / Party' },
  { id: 'calendar', label: 'Weekly Plan' },
  { id: 'home', label: 'Household' },
  { id: 'heart', label: 'Favorites' },
  { id: 'star', label: 'Essentials' },
  { id: 'utensils', label: 'Recipes' },
  { id: 'coffee', label: 'Quick Cafe' },
  { id: 'boxes', label: 'Bulk Wholesale' },
  { id: 'bookmark', label: 'Saved Queue' },
];

export interface MlRestockPrediction {
  itemId?: number | null;
  name: string;
  category: Category;
  currentQuantity: number;
  unit: string;
  predictedDaysUntilDepleted: number;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reasoning: string;
}

export interface MlRestockResponse {
  cold_start?: boolean;
  coldStart?: boolean;
  total_analyzed?: number;
  totalAnalyzed?: number;
  message?: string;
  suggestions: MlRestockPrediction[];
}

