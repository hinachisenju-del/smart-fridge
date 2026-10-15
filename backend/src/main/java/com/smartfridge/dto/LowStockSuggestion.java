package com.smartfridge.dto;

import com.smartfridge.entity.Category;
import java.math.BigDecimal;

public record LowStockSuggestion(
        Long inventoryItemId,
        String name,
        Category category,
        Double currentQuantity,
        Double minimumStockThreshold,
        Double suggestedQuantity,
        String unit,
        BigDecimal estimatedPrice,
        boolean alreadyInShoppingList
) {
}
