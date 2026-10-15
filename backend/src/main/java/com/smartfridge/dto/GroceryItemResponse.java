package com.smartfridge.dto;

import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.ExpiryStatus;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.service.ExpiryStatusService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

public record GroceryItemResponse(
        Long id,
        String productName,
        Category category,
        Double quantity,
        String unit,
        StorageLocation storageLocation,
        Double minimumStockThreshold,
        LocalDate purchaseDate,
        LocalDate expiryDate,
        ExpirySource expirySource,
        BigDecimal price,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        Long daysUntilExpiry,
        ExpiryStatus expiryStatus,
        boolean lowStock
) {
    public static GroceryItemResponse fromEntity(GroceryItem item, ExpiryStatusService expiryService) {
        ExpiryStatus status = expiryService.evaluateStatus(item.getExpiryDate());
        Long days = expiryService.calculateDaysUntilExpiry(item.getExpiryDate());
        boolean isLowStock = item.getQuantity() != null
                && item.getMinimumStockThreshold() != null
                && item.getQuantity() <= item.getMinimumStockThreshold();

        return new GroceryItemResponse(
                item.getId(),
                item.getProductName(),
                item.getCategory(),
                item.getQuantity(),
                item.getUnit(),
                item.getStorageLocation(),
                item.getMinimumStockThreshold(),
                item.getPurchaseDate(),
                item.getExpiryDate(),
                item.getExpirySource(),
                item.getPrice(),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                days,
                status,
                isLowStock
        );
    }

    public static GroceryItemResponse fromEntity(GroceryItem item) {
        return fromEntity(item, new ExpiryStatusService(Clock.systemDefaultZone()));
    }
}
