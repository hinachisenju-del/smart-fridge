package com.smartfridge.controller;

import com.smartfridge.dto.MlSuggestionResponse;
import com.smartfridge.service.MlSuggestionService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ml")
public class MlController {

    private final MlSuggestionService mlSuggestionService;

    public MlController(MlSuggestionService mlSuggestionService) {
        this.mlSuggestionService = mlSuggestionService;
    }

    @GetMapping("/suggestions")
    public MlSuggestionResponse getSuggestions() {
        return mlSuggestionService.getRestockSuggestions();
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return mlSuggestionService.getMlStatus();
    }
}
