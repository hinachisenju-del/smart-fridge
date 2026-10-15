package com.smartfridge.dto;

import java.util.List;

public record MlSuggestionResponse(
        boolean coldStart,
        int totalAnalyzed,
        String message,
        List<MlItemSuggestion> suggestions
) {}
