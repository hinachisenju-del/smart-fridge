package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfridge.controller.MlController;
import com.smartfridge.dto.MlSuggestionResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.repository.GroceryItemRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class MlControllerIntegrationTests {

    @Autowired
    private MlController mlController;

    @Autowired
    private GroceryItemRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void coldStartDetectedWhenInventoryIsEmpty() {
        MlSuggestionResponse response = mlController.getSuggestions();
        assertThat(response).isNotNull();
        assertThat(response.coldStart()).isTrue();
        assertThat(response.totalAnalyzed()).isZero();
        assertThat(response.suggestions()).isEmpty();
        assertThat(response.message()).contains("at least 3 active pantry items");
    }

    @Test
    void coldStartDetectedWhenInventoryIsSparse() {
        createTestItem("Organic Milk", Category.DAIRY, 1.0, 2.0);

        MlSuggestionResponse response = mlController.getSuggestions();
        assertThat(response.coldStart()).isTrue();
        assertThat(response.totalAnalyzed()).isEqualTo(1);
        assertThat(response.suggestions()).isEmpty();
    }

    @Test
    void activePredictionsGeneratedWhenInventoryHasSufficientItems() {
        createTestItem("Organic Milk", Category.DAIRY, 0.4, 2.0);
        createTestItem("Sourdough Bread", Category.BAKERY, 0.2, 1.0);
        createTestItem("Fresh Spinach", Category.PRODUCE, 1.0, 2.0);

        MlSuggestionResponse response = mlController.getSuggestions();
        assertThat(response.coldStart()).isFalse();
        assertThat(response.totalAnalyzed()).isEqualTo(3);
        assertThat(response.suggestions()).hasSize(3);

        response.suggestions().forEach(s -> {
            assertThat(s.name()).isNotEmpty();
            assertThat(s.category()).isNotEmpty();
            assertThat(s.urgency()).isIn("HIGH", "MEDIUM", "LOW");
            assertThat(s.predictedDaysUntilDepleted()).isGreaterThanOrEqualTo(0.0);
            assertThat(s.confidence()).isBetween(0.0, 1.0);
            assertThat(s.reasoning()).isNotEmpty();
        });
    }

    @Test
    void mlStatusReportsPayload() {
        Map<String, Object> status = mlController.getStatus();
        assertThat(status).isNotNull();
        assertThat(status).containsKey("status");
    }

    private void createTestItem(String name, Category cat, double qty, double minThreshold) {
        GroceryItem item = new GroceryItem();
        item.setProductName(name);
        item.setCategory(cat);
        item.setQuantity(qty);
        item.setUnit("units");
        item.setMinimumStockThreshold(minThreshold);
        item.setStorageLocation(StorageLocation.MIDDLE_SHELF);
        item.setPrice(BigDecimal.valueOf(50));
        item.setPurchaseDate(LocalDate.now().minusDays(3));
        repository.save(item);
    }
}
