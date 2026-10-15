package com.smartfridge.dto;

public record MlItemSuggestion(
        Long itemId,
        String name,
        String category,
        double currentQuantity,
        String unit,
        double predictedDaysUntilDepleted,
        String urgency,
        double confidence,
        String reasoning
) {}
