package com.smartfridge.dto;

import java.math.BigDecimal;

public record ShoppingBudgetSummary(
        BigDecimal uncheckedEstimatedTotal,
        long uncheckedItemsWithPriceCount,
        long uncheckedItemsWithoutPriceCount,
        BigDecimal checkedEstimatedTotal,
        long checkedItemsWithPriceCount,
        long checkedItemsWithoutPriceCount,
        long totalUncheckedCount,
        long totalCheckedCount
) {
}
