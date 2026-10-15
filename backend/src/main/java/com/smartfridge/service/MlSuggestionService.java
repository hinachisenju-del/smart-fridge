package com.smartfridge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfridge.dto.MlItemSuggestion;
import com.smartfridge.dto.MlSuggestionResponse;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.repository.GroceryItemRepository;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MlSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(MlSuggestionService.class);
    private static final String ML_SERVICE_URL = "http://localhost:8082/predict";
    private static final String ML_HEALTH_URL = "http://localhost:8082/health";

    private final GroceryItemRepository groceryRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public MlSuggestionService(GroceryItemRepository groceryRepository) {
        this.groceryRepository = groceryRepository;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(1200))
                .build();
    }

    public MlSuggestionResponse getRestockSuggestions() {
        List<GroceryItem> allGroceries = groceryRepository.findAll();

        // Honest cold-start check: sparse household pantry
        if (allGroceries == null || allGroceries.size() < 3) {
            return new MlSuggestionResponse(
                    true,
                    allGroceries != null ? allGroceries.size() : 0,
                    "Smart Restock requires at least 3 active pantry items to identify consumption patterns. Add your common household items to activate ML predictions.",
                    List.of()
            );
        }

        try {
            // Prepare payload for ML service
            List<Map<String, Object>> itemsPayload = new ArrayList<>();
            for (GroceryItem g : allGroceries) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", g.getId());
                map.put("productName", g.getProductName());
                map.put("category", g.getCategory() != null ? g.getCategory().name() : "OTHER");
                map.put("quantity", g.getQuantity());
                map.put("unit", g.getUnit());
                map.put("targetQuantity", Math.max(g.getQuantity(), g.getMinimumStockThreshold() != null ? g.getMinimumStockThreshold() * 1.5 : 2.0));
                map.put("daysSinceRestock", 3.0);
                map.put("purchaseCount", 2);
                itemsPayload.add(map);
            }

            Map<String, Object> body = Map.of("items", itemsPayload);
            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ML_SERVICE_URL))
                    .timeout(Duration.ofMillis(2000))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                boolean coldStart = root.path("cold_start").asBoolean(false);
                int totalAnalyzed = root.path("total_analyzed").asInt(allGroceries.size());
                String message = root.path("message").asText(null);

                List<MlItemSuggestion> suggestions = new ArrayList<>();
                JsonNode itemsNode = root.path("suggestions");
                if (itemsNode.isArray()) {
                    for (JsonNode item : itemsNode) {
                        suggestions.add(new MlItemSuggestion(
                                item.path("itemId").isNull() ? null : item.path("itemId").asLong(),
                                item.path("name").asText("Item"),
                                item.path("category").asText("OTHER"),
                                item.path("currentQuantity").asDouble(0.0),
                                item.path("unit").asText("units"),
                                item.path("predictedDaysUntilDepleted").asDouble(0.0),
                                item.path("urgency").asText("LOW"),
                                item.path("confidence").asDouble(0.5),
                                item.path("reasoning").asText("")
                        ));
                    }
                }

                return new MlSuggestionResponse(coldStart, totalAnalyzed, message, suggestions);
            }
        } catch (Exception e) {
            log.warn("ML microservice unavailable at {}: {}. Falling back to rule-based restock cadence.", ML_SERVICE_URL, e.getMessage());
        }

        // ponytail: Heuristic fallback when ML daemon is down or unreachable.
        // Ceiling: static consumption rates; upgrade path: self-hosted Scikit-learn FastAPI daemon on port 8082.
        return fallbackSuggestions(allGroceries);
    }

    public Map<String, Object> getMlStatus() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ML_HEALTH_URL))
                    .timeout(Duration.ofMillis(1000))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), Map.class);
            }
        } catch (Exception ignored) {
        }

        return Map.of(
                "status", "OFFLINE",
                "service", "smart-list-ml",
                "message", "ML microservice is offline or unreachable on port 8082."
        );
    }

    private MlSuggestionResponse fallbackSuggestions(List<GroceryItem> items) {
        List<MlItemSuggestion> suggestions = new ArrayList<>();
        for (GroceryItem g : items) {
            double qty = g.getQuantity();
            double minThreshold = g.getMinimumStockThreshold() != null ? g.getMinimumStockThreshold() : 1.0;
            double daysLeft = qty <= minThreshold ? 1.0 : (qty / Math.max(0.2, minThreshold * 0.3));
            String urgency = daysLeft <= 2.0 ? "HIGH" : (daysLeft <= 5.0 ? "MEDIUM" : "LOW");

            suggestions.add(new MlItemSuggestion(
                    g.getId(),
                    g.getProductName(),
                    g.getCategory() != null ? g.getCategory().name() : "OTHER",
                    qty,
                    g.getUnit(),
                    Math.round(daysLeft * 10.0) / 10.0,
                    urgency,
                    0.65,
                    "Estimated via heuristic consumption cadence."
            ));
        }

        suggestions.sort((a, b) -> Double.compare(a.predictedDaysUntilDepleted(), b.predictedDaysUntilDepleted()));
        return new MlSuggestionResponse(false, items.size(), null, suggestions);
    }
}
