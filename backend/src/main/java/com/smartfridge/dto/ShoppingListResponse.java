package com.smartfridge.dto;

import com.smartfridge.entity.ShoppingList;
import com.smartfridge.entity.ShoppingListItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record ShoppingListResponse(
        Long id,
        String title,
        String color,
        String icon,
        boolean isArchived,
        boolean isDefault,
        int itemCount,
        int uncheckedItemCount,
        BigDecimal estimatedTotal,
        Instant createdAt,
        Instant updatedAt,
        List<ShoppingListItemResponse> items
) {
    public static ShoppingListResponse fromEntity(ShoppingList list, boolean includeItems) {
        List<ShoppingListItem> entityItems = list.getItems() != null ? list.getItems() : Collections.emptyList();
        int total = entityItems.size();
        int unchecked = 0;
        BigDecimal totalEst = BigDecimal.ZERO;

        for (ShoppingListItem item : entityItems) {
            if (!item.isPurchased()) {
                unchecked++;
            }
            if (item.getEstimatedPrice() != null) {
                BigDecimal qty = BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 1.0);
                totalEst = totalEst.add(item.getEstimatedPrice().multiply(qty));
            }
        }

        List<ShoppingListItemResponse> itemResponses = includeItems
                ? entityItems.stream().map(ShoppingListItemResponse::fromEntity).toList()
                : null;

        return new ShoppingListResponse(
                list.getId(),
                list.getTitle(),
                list.getColor(),
                list.getIcon(),
                list.isArchived(),
                list.isDefault(),
                total,
                unchecked,
                totalEst,
                list.getCreatedAt(),
                list.getUpdatedAt(),
                itemResponses
        );
    }
}
