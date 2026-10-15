package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfridge.controller.InventoryController;
import com.smartfridge.dto.DashboardSummaryResponse;
import com.smartfridge.dto.GroceryItemRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.ExpiryStatus;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.repository.GroceryItemRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest
class ExpiryTrackingIntegrationTests {

    private static final LocalDate FIXED_TODAY = LocalDate.of(2026, 10, 13);
    private static final Clock FIXED_CLOCK = Clock.fixed(
            FIXED_TODAY.atStartOfDay(ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC")
    );

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        Clock testClock() {
            return FIXED_CLOCK;
        }
    }

    @Autowired
    private InventoryController inventoryController;

    @Autowired
    private GroceryItemRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("Date boundary evaluation matches EXACT expiry status rules")
    void dateBoundariesEvaluateToExpectedExpiryStatuses() {
        // 1. -1 day (yesterday) -> EXPIRED
        GroceryItemResponse yesterdayItem = inventoryController.createItem(
                buildRequest("Expired Yogurt", FIXED_TODAY.minusDays(1), ExpirySource.CONFIRMED, 1.0)
        ).getBody();
        assertThat(yesterdayItem).isNotNull();
        assertThat(yesterdayItem.expiryStatus()).isEqualTo(ExpiryStatus.EXPIRED);
        assertThat(yesterdayItem.daysUntilExpiry()).isEqualTo(-1L);

        // 2. 0 days (today) -> EXPIRES_TODAY
        GroceryItemResponse todayItem = inventoryController.createItem(
                buildRequest("Avocado (Ripe)", FIXED_TODAY, ExpirySource.ESTIMATED, 2.0)
        ).getBody();
        assertThat(todayItem).isNotNull();
        assertThat(todayItem.expiryStatus()).isEqualTo(ExpiryStatus.EXPIRES_TODAY);
        assertThat(todayItem.daysUntilExpiry()).isZero();

        // 3. +1 day (tomorrow) -> EXPIRING_SOON
        GroceryItemResponse tomorrowItem = inventoryController.createItem(
                buildRequest("Raw Salmon Fillet", FIXED_TODAY.plusDays(1), ExpirySource.CONFIRMED, 1.0)
        ).getBody();
        assertThat(tomorrowItem).isNotNull();
        assertThat(tomorrowItem.expiryStatus()).isEqualTo(ExpiryStatus.EXPIRING_SOON);
        assertThat(tomorrowItem.daysUntilExpiry()).isEqualTo(1L);

        // 4. +3 days -> EXPIRING_SOON (boundary inclusive)
        GroceryItemResponse threeDaysItem = inventoryController.createItem(
                buildRequest("Almond Milk", FIXED_TODAY.plusDays(3), ExpirySource.CONFIRMED, 1.0)
        ).getBody();
        assertThat(threeDaysItem).isNotNull();
        assertThat(threeDaysItem.expiryStatus()).isEqualTo(ExpiryStatus.EXPIRING_SOON);
        assertThat(threeDaysItem.daysUntilExpiry()).isEqualTo(3L);

        // 5. +4 days -> FRESH (more than 3 days away)
        GroceryItemResponse fourDaysItem = inventoryController.createItem(
                buildRequest("Sourdough Loaf", FIXED_TODAY.plusDays(4), ExpirySource.ESTIMATED, 1.0)
        ).getBody();
        assertThat(fourDaysItem).isNotNull();
        assertThat(fourDaysItem.expiryStatus()).isEqualTo(ExpiryStatus.FRESH);
        assertThat(fourDaysItem.daysUntilExpiry()).isEqualTo(4L);

        // 6. null expiry date -> NO_EXPIRY
        GroceryItemResponse noExpiryItem = inventoryController.createItem(
                buildRequest("Himalayan Pink Salt", null, null, 1.0)
        ).getBody();
        assertThat(noExpiryItem).isNotNull();
        assertThat(noExpiryItem.expiryStatus()).isEqualTo(ExpiryStatus.NO_EXPIRY);
        assertThat(noExpiryItem.daysUntilExpiry()).isNull();
    }

    @Test
    @DisplayName("Expiry source distinction CONFIRMED vs ESTIMATED is preserved")
    void expirySourceDistinctionIsPreserved() {
        GroceryItemResponse confirmed = inventoryController.createItem(
                buildRequest("Pasteurized Milk", FIXED_TODAY.plusDays(2), ExpirySource.CONFIRMED, 1.0)
        ).getBody();
        GroceryItemResponse estimated = inventoryController.createItem(
                buildRequest("Leftover Roast Chicken", FIXED_TODAY.plusDays(2), ExpirySource.ESTIMATED, 1.0)
        ).getBody();

        assertThat(confirmed).isNotNull();
        assertThat(confirmed.expirySource()).isEqualTo(ExpirySource.CONFIRMED);

        assertThat(estimated).isNotNull();
        assertThat(estimated.expirySource()).isEqualTo(ExpirySource.ESTIMATED);
    }

    @Test
    @DisplayName("Dashboard sections are mutually exclusive with zero duplicate items")
    void dashboardSectionsHaveNoDuplicateItems() {
        // Item 1: Expired (-2 days)
        GroceryItemResponse item1 = inventoryController.createItem(
                buildRequest("Expired Cream Cheese", FIXED_TODAY.minusDays(2), ExpirySource.CONFIRMED, 1.0)
        ).getBody();

        // Item 2: Expires Today (0 days)
        GroceryItemResponse item2 = inventoryController.createItem(
                buildRequest("Fresh Bread", FIXED_TODAY, ExpirySource.CONFIRMED, 2.0)
        ).getBody();

        // Item 3: Expiring Soon (+2 days)
        GroceryItemResponse item3 = inventoryController.createItem(
                buildRequest("Greek Yogurt", FIXED_TODAY.plusDays(2), ExpirySource.CONFIRMED, 3.0)
        ).getBody();

        // Item 4: Fresh (+10 days)
        GroceryItemResponse item4 = inventoryController.createItem(
                buildRequest("Aged Cheddar", FIXED_TODAY.plusDays(10), ExpirySource.CONFIRMED, 1.0)
        ).getBody();

        // Item 5: Finished item with quantity 0 (expired date but finished)
        GroceryItemResponse item5 = inventoryController.createItem(
                buildRequest("Old Mayo (Finished)", FIXED_TODAY.minusDays(5), ExpirySource.CONFIRMED, 0.0)
        ).getBody();

        ResponseEntity<DashboardSummaryResponse> summaryResponse = inventoryController.getDashboardSummary();
        assertThat(summaryResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardSummaryResponse summary = summaryResponse.getBody();
        assertThat(summary).isNotNull();

        assertThat(summary.totalInventoryCount()).isEqualTo(5);
        assertThat(summary.expiredCount()).isEqualTo(1);
        assertThat(summary.expiringTodayCount()).isEqualTo(1);
        assertThat(summary.expiringSoonCount()).isEqualTo(1);

        assertThat(summary.expiredItems()).hasSize(1);
        assertThat(summary.expiredItems().get(0).id()).isEqualTo(item1.id());

        assertThat(summary.expiringTodayItems()).hasSize(1);
        assertThat(summary.expiringTodayItems().get(0).id()).isEqualTo(item2.id());

        assertThat(summary.expiringSoonItems()).hasSize(1);
        assertThat(summary.expiringSoonItems().get(0).id()).isEqualTo(item3.id());

        // Verify mutually exclusive set of IDs across all 3 sections
        Set<Long> expiredIds = new HashSet<>();
        summary.expiredItems().forEach(i -> expiredIds.add(i.id()));

        Set<Long> expiringTodayIds = new HashSet<>();
        summary.expiringTodayItems().forEach(i -> expiringTodayIds.add(i.id()));

        Set<Long> expiringSoonIds = new HashSet<>();
        summary.expiringSoonItems().forEach(i -> expiringSoonIds.add(i.id()));

        // Intersection checks
        assertThat(expiredIds).doesNotContainAnyElementsOf(expiringTodayIds);
        assertThat(expiredIds).doesNotContainAnyElementsOf(expiringSoonIds);
        assertThat(expiringTodayIds).doesNotContainAnyElementsOf(expiringSoonIds);
    }

    @Test
    @DisplayName("Filtered expiry endpoint GET /api/inventory/expiry?status=... filters accurately")
    void filteredExpiryEndpointReturnsCorrectSubsets() {
        inventoryController.createItem(
                buildRequest("Item Expired", FIXED_TODAY.minusDays(1), ExpirySource.CONFIRMED, 1.0)
        );
        inventoryController.createItem(
                buildRequest("Item Today", FIXED_TODAY, ExpirySource.CONFIRMED, 1.0)
        );
        inventoryController.createItem(
                buildRequest("Item Soon", FIXED_TODAY.plusDays(2), ExpirySource.CONFIRMED, 1.0)
        );
        inventoryController.createItem(
                buildRequest("Item Fresh", FIXED_TODAY.plusDays(10), ExpirySource.CONFIRMED, 1.0)
        );
        inventoryController.createItem(
                buildRequest("Item No Expiry", null, null, 1.0)
        );

        // 1. Filter EXPIRED
        List<GroceryItemResponse> expired = inventoryController.listByExpiry(ExpiryStatus.EXPIRED).getBody();
        assertThat(expired).hasSize(1);
        assertThat(expired.get(0).productName()).isEqualTo("Item Expired");

        // 2. Filter EXPIRES_TODAY
        List<GroceryItemResponse> today = inventoryController.listByExpiry(ExpiryStatus.EXPIRES_TODAY).getBody();
        assertThat(today).hasSize(1);
        assertThat(today.get(0).productName()).isEqualTo("Item Today");

        // 3. Filter EXPIRING_SOON
        List<GroceryItemResponse> soon = inventoryController.listByExpiry(ExpiryStatus.EXPIRING_SOON).getBody();
        assertThat(soon).hasSize(1);
        assertThat(soon.get(0).productName()).isEqualTo("Item Soon");

        // 4. Filter FRESH
        List<GroceryItemResponse> fresh = inventoryController.listByExpiry(ExpiryStatus.FRESH).getBody();
        assertThat(fresh).hasSize(1);
        assertThat(fresh.get(0).productName()).isEqualTo("Item Fresh");

        // 5. Filter NO_EXPIRY
        List<GroceryItemResponse> noExpiry = inventoryController.listByExpiry(ExpiryStatus.NO_EXPIRY).getBody();
        assertThat(noExpiry).hasSize(1);
        assertThat(noExpiry.get(0).productName()).isEqualTo("Item No Expiry");

        // 6. Unfiltered returns all 5 items
        List<GroceryItemResponse> all = inventoryController.listByExpiry(null).getBody();
        assertThat(all).hasSize(5);
    }

    private GroceryItemRequest buildRequest(
            String name,
            LocalDate expiryDate,
            ExpirySource expirySource,
            Double quantity
    ) {
        GroceryItemRequest req = new GroceryItemRequest();
        req.setProductName(name);
        req.setCategory(Category.DAIRY);
        req.setQuantity(quantity);
        req.setUnit("units");
        req.setStorageLocation(StorageLocation.MIDDLE_SHELF);
        req.setMinimumStockThreshold(1.0);
        req.setPurchaseDate(FIXED_TODAY.minusDays(5));
        req.setExpiryDate(expiryDate);
        req.setExpirySource(expirySource);
        req.setPrice(new BigDecimal("99.00"));
        return req;
    }
}
