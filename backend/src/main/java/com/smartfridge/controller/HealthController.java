package com.smartfridge.controller;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        List<String> profiles = Arrays.asList(
                environment.getActiveProfiles().length > 0
                        ? environment.getActiveProfiles()
                        : environment.getDefaultProfiles()
        );

        String databaseMode = profiles.contains("postgres")
                ? "PostgreSQL (primary)"
                : "H2 File-Backed (development fallback)";

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", "UP");
        payload.put("service", "smart-fridge-backend");
        payload.put("activeProfiles", profiles);
        payload.put("database", databaseMode);
        payload.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(payload);
    }
}
