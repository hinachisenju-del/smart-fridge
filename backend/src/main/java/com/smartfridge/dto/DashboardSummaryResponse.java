package com.smartfridge.dto;

import java.util.List;

public record DashboardSummaryResponse(
        long totalInventoryCount,
        long expiredCount,
        long expiringTodayCount,
        long expiringSoonCount,
        long lowStockCount,
        long shoppingListCount,
        List<GroceryItemResponse> recentlyUpdatedGroceries,
        List<GroceryItemResponse> expiredItems,
        List<GroceryItemResponse> expiringTodayItems,
        List<GroceryItemResponse> expiringSoonItems,
        List<ShoppingListItemResponse> upcomingShoppingList,
        List<LowStockSuggestion> lowStockSuggestions,
        ShoppingBudgetSummary budgetSummary
) {
}
