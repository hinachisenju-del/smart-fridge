package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartfridge.controller.InventoryController;
import com.smartfridge.dto.DashboardSummaryResponse;
import com.smartfridge.dto.GroceryItemRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.dto.QuantityActionType;
import com.smartfridge.dto.QuantityAdjustmentRequest;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.exception.InvalidInventoryOperationException;
import com.smartfridge.exception.ResourceNotFoundException;
import com.smartfridge.repository.GroceryItemRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest
class InventoryControllerIntegrationTests {

    @Autowired
    private InventoryController inventoryController;

    @Autowired
    private GroceryItemRepository repository;

    @Autowired
    private Validator validator;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void emptyInventoryReturnsZeroCountsAndEmptyLists() {
        ResponseEntity<List<GroceryItemResponse>> listResponse =
                inventoryController.listItems(null, null, null, "expiryDate", "asc");
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody()).isEmpty();

        ResponseEntity<DashboardSummaryResponse> summaryResponse =
                inventoryController.getDashboardSummary();
        assertThat(summaryResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardSummaryResponse summary = summaryResponse.getBody();
        assertThat(summary).isNotNull();
        assertThat(summary.totalInventoryCount()).isZero();
        assertThat(summary.expiredCount()).isZero();
        assertThat(summary.expiringTodayCount()).isZero();
        assertThat(summary.expiringSoonCount()).isZero();
        assertThat(summary.lowStockCount()).isZero();
        assertThat(summary.shoppingListCount()).isZero();
        assertThat(summary.recentlyUpdatedGroceries()).isEmpty();
        assertThat(summary.expiredItems()).isEmpty();
        assertThat(summary.expiringTodayItems()).isEmpty();
        assertThat(summary.expiringSoonItems()).isEmpty();
        assertThat(summary.upcomingShoppingList()).isEmpty();
        assertThat(summary.lowStockSuggestions()).isEmpty();
    }

    @Test
    void addEditAndDeleteGroceryItemPersistsCorrectly() {
        GroceryItemRequest createReq = buildSampleRequest(
                "Organic Whole Milk",
                Category.DAIRY,
                2.0,
                "cartons",
                StorageLocation.UPPER_SHELF,
                1.0,
                LocalDate.now().plusDays(4),
                ExpirySource.CONFIRMED
        );
        createReq.setPrice(new BigDecimal("140.00"));
        createReq.setNotes("A2 pasteurized milk");

        ResponseEntity<GroceryItemResponse> createRes = inventoryController.createItem(createReq);
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        GroceryItemResponse created = createRes.getBody();
        assertThat(created).isNotNull();
        assertThat(created.id()).isNotNull();
        assertThat(created.productName()).isEqualTo("Organic Whole Milk");
        assertThat(created.quantity()).isEqualTo(2.0);
        assertThat(created.expirySource()).isEqualTo(ExpirySource.CONFIRMED);
        assertThat(created.createdAt()).isNotNull();
        assertThat(created.updatedAt()).isNotNull();

        // Edit item
        GroceryItemRequest updateReq = buildSampleRequest(
                "Organic A2 Whole Milk",
                Category.DAIRY,
                3.5,
                "L",
                StorageLocation.DOOR_BIN,
                1.5,
                LocalDate.now().plusDays(6),
                ExpirySource.ESTIMATED
        );
        ResponseEntity<GroceryItemResponse> updateRes =
                inventoryController.updateItem(created.id(), updateReq);
        assertThat(updateRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        GroceryItemResponse updated = updateRes.getBody();
        assertThat(updated).isNotNull();
        assertThat(updated.productName()).isEqualTo("Organic A2 Whole Milk");
        assertThat(updated.quantity()).isEqualTo(3.5);
        assertThat(updated.unit()).isEqualTo("L");
        assertThat(updated.storageLocation()).isEqualTo(StorageLocation.DOOR_BIN);
        assertThat(updated.expirySource()).isEqualTo(ExpirySource.ESTIMATED);

        // Delete item
        ResponseEntity<Void> deleteRes = inventoryController.deleteItem(created.id());
        assertThat(deleteRes.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(repository.count()).isZero();
    }

    @Test
    void searchFilterAndSortItemsWorkCorrectly() {
        inventoryController.createItem(buildSampleRequest(
                "Baby Spinach",
                Category.PRODUCE,
                1.0,
                "packs",
                StorageLocation.CRISPER_DRAWER,
                2.0,
                LocalDate.now().plusDays(2),
                ExpirySource.ESTIMATED
        ));
        inventoryController.createItem(buildSampleRequest(
                "Greek Yogurt",
                Category.DAIRY,
                4.0,
                "cups",
                StorageLocation.UPPER_SHELF,
                2.0,
                LocalDate.now().plusDays(8),
                ExpirySource.CONFIRMED
        ));
        inventoryController.createItem(buildSampleRequest(
                "Cheddar Cheese",
                Category.DAIRY,
                2.0,
                "blocks",
                StorageLocation.MIDDLE_SHELF,
                1.0,
                LocalDate.now().plusDays(14),
                ExpirySource.CONFIRMED
        ));

        // Search by product name
        List<GroceryItemResponse> searchResult =
                inventoryController.listItems("spinach", null, null, "name", "asc").getBody();
        assertThat(searchResult).hasSize(1);
        assertThat(searchResult.get(0).productName()).isEqualTo("Baby Spinach");

        // Filter by category
        List<GroceryItemResponse> dairyItems =
                inventoryController.listItems(null, Category.DAIRY, null, "name", "asc").getBody();
        assertThat(dairyItems).hasSize(2);
        assertThat(dairyItems.get(0).productName()).isEqualTo("Cheddar Cheese");
        assertThat(dairyItems.get(1).productName()).isEqualTo("Greek Yogurt");

        // Filter by storage location
        List<GroceryItemResponse> crisperItems =
                inventoryController.listItems(null, null, StorageLocation.CRISPER_DRAWER, "name", "asc").getBody();
        assertThat(crisperItems).hasSize(1);
        assertThat(crisperItems.get(0).productName()).isEqualTo("Baby Spinach");

        // Sort by quantity descending
        List<GroceryItemResponse> byQuantityDesc =
                inventoryController.listItems(null, null, null, "quantity", "desc").getBody();
        assertThat(byQuantityDesc).extracting(GroceryItemResponse::productName)
                .containsExactly("Greek Yogurt", "Cheddar Cheese", "Baby Spinach");
    }

    @Test
    void useRestockFinishAndCorrectQuantityPersistAndPreventNegativeQuantities() {
        GroceryItemResponse item = inventoryController.createItem(buildSampleRequest(
                "Free-Range Eggs",
                Category.DAIRY,
                6.0,
                "pcs",
                StorageLocation.MIDDLE_SHELF,
                4.0,
                LocalDate.now().plusDays(10),
                ExpirySource.CONFIRMED
        )).getBody();
        assertThat(item).isNotNull();

        // 1. Use 2 pcs -> remaining 4.0
        QuantityAdjustmentRequest useReq = new QuantityAdjustmentRequest();
        useReq.setAction(QuantityActionType.USE);
        useReq.setAmount(2.0);
        GroceryItemResponse afterUse =
                inventoryController.adjustQuantity(item.id(), useReq).getBody();
        assertThat(afterUse).isNotNull();
        assertThat(afterUse.quantity()).isEqualTo(4.0);
        assertThat(afterUse.lowStock()).isTrue();

        // 2. Prevent using more than available (e.g., use 5 when 4 available)
        QuantityAdjustmentRequest excessiveUse = new QuantityAdjustmentRequest();
        excessiveUse.setAction(QuantityActionType.USE);
        excessiveUse.setAmount(5.0);
        assertThatThrownBy(() -> inventoryController.adjustQuantity(item.id(), excessiveUse))
                .isInstanceOf(InvalidInventoryOperationException.class)
                .hasMessageContaining("Cannot use 5.0 pcs");

        // 3. Restock 8 pcs -> 12.0
        QuantityAdjustmentRequest restockReq = new QuantityAdjustmentRequest();
        restockReq.setAction(QuantityActionType.RESTOCK);
        restockReq.setAmount(8.0);
        GroceryItemResponse afterRestock =
                inventoryController.adjustQuantity(item.id(), restockReq).getBody();
        assertThat(afterRestock).isNotNull();
        assertThat(afterRestock.quantity()).isEqualTo(12.0);
        assertThat(afterRestock.lowStock()).isFalse();

        // 4. Correct quantity to 5.0
        QuantityAdjustmentRequest correctReq = new QuantityAdjustmentRequest();
        correctReq.setAction(QuantityActionType.CORRECT);
        correctReq.setAmount(5.0);
        GroceryItemResponse afterCorrect =
                inventoryController.adjustQuantity(item.id(), correctReq).getBody();
        assertThat(afterCorrect).isNotNull();
        assertThat(afterCorrect.quantity()).isEqualTo(5.0);

        // 5. Prevent negative corrected quantity
        QuantityAdjustmentRequest negativeCorrect = new QuantityAdjustmentRequest();
        negativeCorrect.setAction(QuantityActionType.CORRECT);
        negativeCorrect.setAmount(-1.0);
        assertThatThrownBy(() -> inventoryController.adjustQuantity(item.id(), negativeCorrect))
                .isInstanceOf(InvalidInventoryOperationException.class)
                .hasMessageContaining("cannot be negative");

        // 6. Mark as finished -> 0.0
        QuantityAdjustmentRequest finishReq = new QuantityAdjustmentRequest();
        finishReq.setAction(QuantityActionType.FINISH);
        GroceryItemResponse afterFinish =
                inventoryController.adjustQuantity(item.id(), finishReq).getBody();
        assertThat(afterFinish).isNotNull();
        assertThat(afterFinish.quantity()).isEqualTo(0.0);
        assertThat(afterFinish.lowStock()).isTrue();
    }

    @Test
    void dashboardSummaryComputesExpiringSoonLowStockAndShoppingListPreview() {
        // Expiring in 2 days, normal stock
        inventoryController.createItem(buildSampleRequest(
                "Fresh Strawberries",
                Category.PRODUCE,
                2.0,
                "boxes",
                StorageLocation.UPPER_SHELF,
                1.0,
                LocalDate.now().plusDays(2),
                ExpirySource.ESTIMATED
        ));

        // Low stock item (quantity 0.5 <= threshold 2.0), fresh expiry
        inventoryController.createItem(buildSampleRequest(
                "Cold Brew Coffee",
                Category.BEVERAGES,
                0.5,
                "bottles",
                StorageLocation.DOOR_BIN,
                2.0,
                LocalDate.now().plusDays(12),
                ExpirySource.CONFIRMED
        ));

        DashboardSummaryResponse summary = inventoryController.getDashboardSummary().getBody();
        assertThat(summary).isNotNull();
        assertThat(summary.totalInventoryCount()).isEqualTo(2);
        assertThat(summary.expiringSoonCount()).isEqualTo(1);
        assertThat(summary.lowStockCount()).isEqualTo(1);
        assertThat(summary.shoppingListCount()).isZero();
        assertThat(summary.expiringSoonItems()).hasSize(1);
        assertThat(summary.expiringSoonItems().get(0).productName()).isEqualTo("Fresh Strawberries");
        assertThat(summary.lowStockSuggestions()).hasSize(1);
        assertThat(summary.lowStockSuggestions().get(0).name()).isEqualTo("Cold Brew Coffee");
        assertThat(summary.upcomingShoppingList()).isEmpty();
    }

    @Test
    void validationAndNotFoundErrorsAreHandledProperly() {
        GroceryItemRequest invalidReq = buildSampleRequest(
                "",
                Category.DAIRY,
                -3.0,
                "L",
                StorageLocation.UPPER_SHELF,
                1.0,
                LocalDate.now().plusDays(3),
                ExpirySource.CONFIRMED
        );
        Set<ConstraintViolation<GroceryItemRequest>> violations = validator.validate(invalidReq);
        assertThat(violations).isNotEmpty();

        assertThatThrownBy(() -> inventoryController.getItem(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99999");
    }

    private GroceryItemRequest buildSampleRequest(
            String name,
            Category category,
            Double quantity,
            String unit,
            StorageLocation location,
            Double minThreshold,
            LocalDate expiryDate,
            ExpirySource expirySource
    ) {
        GroceryItemRequest req = new GroceryItemRequest();
        req.setProductName(name);
        req.setCategory(category);
        req.setQuantity(quantity);
        req.setUnit(unit);
        req.setStorageLocation(location);
        req.setMinimumStockThreshold(minThreshold);
        req.setPurchaseDate(LocalDate.now());
        req.setExpiryDate(expiryDate);
        req.setExpirySource(expirySource);
        return req;
    }
}
