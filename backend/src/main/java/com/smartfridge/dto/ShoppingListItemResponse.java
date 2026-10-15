package com.smartfridge.dto;

import com.smartfridge.entity.Category;
import com.smartfridge.entity.ShoppingItemPriority;
import com.smartfridge.entity.ShoppingListItem;
import java.math.BigDecimal;
import java.time.Instant;

public record ShoppingListItemResponse(
        Long id,
        String name,
        Category category,
        Double quantity,
        String unit,
        BigDecimal estimatedPrice,
        boolean purchased,
        ShoppingItemPriority priority,
        String notes,
        Long inventoryItemId,
        Long shoppingListId,
        Instant createdAt,
        Instant updatedAt
) {
    public static ShoppingListItemResponse fromEntity(ShoppingListItem item) {
        Long listId = item.getShoppingList() != null ? item.getShoppingList().getId() : null;
        return new ShoppingListItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.getUnit(),
                item.getEstimatedPrice(),
                item.isPurchased(),
                item.getPriority(),
                item.getNotes(),
                item.getInventoryItemId(),
                listId,
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
