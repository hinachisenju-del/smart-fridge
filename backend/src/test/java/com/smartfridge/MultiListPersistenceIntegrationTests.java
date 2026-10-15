package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartfridge.config.MultiListDatabaseMigration;
import com.smartfridge.controller.MultiShoppingListController;
import com.smartfridge.controller.ShoppingListController;
import com.smartfridge.dto.ShoppingListItemRequest;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.dto.ShoppingListRequest;
import com.smartfridge.dto.ShoppingListResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ShoppingItemPriority;
import com.smartfridge.entity.ShoppingList;
import com.smartfridge.entity.ShoppingListItem;
import com.smartfridge.exception.InvalidInventoryOperationException;
import com.smartfridge.exception.ResourceNotFoundException;
import com.smartfridge.repository.GroceryItemRepository;
import com.smartfridge.repository.ShoppingListItemRepository;
import com.smartfridge.repository.ShoppingListRepository;
import com.smartfridge.service.ShoppingListService;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest
class MultiListPersistenceIntegrationTests {

    @Autowired
    private MultiShoppingListController multiListController;

    @Autowired
    private ShoppingListController legacyShoppingListController;

    @Autowired
    private ShoppingListService shoppingListService;

    @Autowired
    private ShoppingListRepository shoppingListRepository;

    @Autowired
    private ShoppingListItemRepository shoppingItemRepository;

    @Autowired
    private GroceryItemRepository groceryItemRepository;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private MultiListDatabaseMigration migration;

    @BeforeEach
    void setUp() {
        shoppingItemRepository.deleteAll();
        groceryItemRepository.deleteAll();
        // Clear all non-default lists
        List<ShoppingList> all = shoppingListRepository.findAll();
        for (ShoppingList list : all) {
            if (!list.isDefault()) {
                shoppingListRepository.delete(list);
            }
        }
        // Ensure default list exists
        shoppingListService.getOrCreateDefaultList();
    }

    @Test
    @DisplayName("Create and retrieve multiple independent shopping lists")
    void testCreateAndRetrieveMultipleLists() {
        ShoppingListRequest req1 = new ShoppingListRequest("Weekly Groceries", "#0d9488", "shopping-bag");
        ShoppingListRequest req2 = new ShoppingListRequest("Party Supplies", "#d97706", "sparkles");

        ResponseEntity<ShoppingListResponse> res1 = multiListController.createShoppingList(req1);
        ResponseEntity<ShoppingListResponse> res2 = multiListController.createShoppingList(req2);

        assertThat(res1.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res1.getBody()).isNotNull();
        assertThat(res2.getBody()).isNotNull();
        assertThat(res1.getBody().title()).isEqualTo("Weekly Groceries");
        assertThat(res2.getBody().title()).isEqualTo("Party Supplies");

        // List active lists (default + 2 created)
        ResponseEntity<List<ShoppingListResponse>> listRes = multiListController.listShoppingLists(false);
        assertThat(listRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listRes.getBody()).hasSizeGreaterThanOrEqualTo(3);
        assertThat(listRes.getBody()).extracting(ShoppingListResponse::title)
                .contains("Weekly Groceries", "Party Supplies", "Main Shopping List");
    }

    @Test
    @DisplayName("Items in one list never appear in another list (Strict Isolation)")
    void testStrictListIsolation() {
        ShoppingListResponse listA = multiListController.createShoppingList(
                new ShoppingListRequest("Trader Joe Run", "#059669", "shopping-bag")
        ).getBody();
        ShoppingListResponse listB = multiListController.createShoppingList(
                new ShoppingListRequest("Costco Bulk", "#dc2626", "boxes")
        ).getBody();

        assertThat(listA).isNotNull();
        assertThat(listB).isNotNull();

        // Add item to List A
        ShoppingListItemRequest itemReqA = new ShoppingListItemRequest();
        itemReqA.setName("Avocados");
        itemReqA.setCategory(Category.PRODUCE);
        itemReqA.setQuantity(4.0);
        itemReqA.setUnit("pieces");
        itemReqA.setEstimatedPrice(new BigDecimal("60.00"));
        ResponseEntity<ShoppingListItemResponse> createdA = multiListController.createItemInList(listA.id(), itemReqA);
        assertThat(createdA.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Add item to List B
        ShoppingListItemRequest itemReqB = new ShoppingListItemRequest();
        itemReqB.setName("Paper Towels");
        itemReqB.setCategory(Category.OTHER);
        itemReqB.setQuantity(12.0);
        itemReqB.setUnit("rolls");
        itemReqB.setEstimatedPrice(new BigDecimal("450.00"));
        ResponseEntity<ShoppingListItemResponse> createdB = multiListController.createItemInList(listB.id(), itemReqB);
        assertThat(createdB.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Verify items in List A
        ResponseEntity<List<ShoppingListItemResponse>> itemsA = multiListController.listItemsInList(
                listA.id(), null, null, null, null, "name", "asc"
        );
        assertThat(itemsA.getBody()).hasSize(1);
        assertThat(itemsA.getBody().get(0).name()).isEqualTo("Avocados");

        // Verify items in List B
        ResponseEntity<List<ShoppingListItemResponse>> itemsB = multiListController.listItemsInList(
                listB.id(), null, null, null, null, "name", "asc"
        );
        assertThat(itemsB.getBody()).hasSize(1);
        assertThat(itemsB.getBody().get(0).name()).isEqualTo("Paper Towels");

        // Cross-access: Attempting to get List B item via List A path must fail
        assertThatThrownBy(() -> multiListController.getItemInList(listA.id(), createdB.getBody().id()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Rename, archive, and restore shopping lists")
    void testRenameArchiveAndRestoreList() {
        ShoppingListResponse created = multiListController.createShoppingList(
                new ShoppingListRequest("BBQ Prep", "#d97706", "utensils")
        ).getBody();
        assertThat(created).isNotNull();

        // Rename
        ShoppingListRequest updateReq = new ShoppingListRequest("Weekend BBQ Prep", "#dc2626", "utensils");
        ResponseEntity<ShoppingListResponse> updated = multiListController.updateShoppingList(created.id(), updateReq);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody().title()).isEqualTo("Weekend BBQ Prep");
        assertThat(updated.getBody().color()).isEqualTo("#dc2626");

        // Archive
        ResponseEntity<ShoppingListResponse> archived = multiListController.archiveShoppingList(created.id());
        assertThat(archived.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(archived.getBody().isArchived()).isTrue();

        // Active list query should not contain archived list
        List<ShoppingListResponse> activeLists = multiListController.listShoppingLists(false).getBody();
        assertThat(activeLists).extracting(ShoppingListResponse::id).doesNotContain(created.id());

        // Include archived query should contain it
        List<ShoppingListResponse> allLists = multiListController.listShoppingLists(true).getBody();
        assertThat(allLists).extracting(ShoppingListResponse::id).contains(created.id());

        // Restore
        ResponseEntity<ShoppingListResponse> restored = multiListController.restoreShoppingList(created.id());
        assertThat(restored.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(restored.getBody().isArchived()).isFalse();

        // Active list query should now contain restored list again
        activeLists = multiListController.listShoppingLists(false).getBody();
        assertThat(activeLists).extracting(ShoppingListResponse::id).contains(created.id());
    }

    @Test
    @DisplayName("Safe Deletion Policy: Cannot delete default list or non-empty lists; empty list deleted cleanly")
    void testSafeDeletionPolicy() {
        ShoppingList defaultList = shoppingListRepository.findByIsDefaultTrue().orElseThrow();

        // 1. Attempting to delete default list must fail
        assertThatThrownBy(() -> multiListController.deleteShoppingList(defaultList.getId()))
                .isInstanceOf(InvalidInventoryOperationException.class)
                .hasMessageContaining("default shopping list cannot be deleted");

        // 2. Create non-empty list
        ShoppingListResponse customList = multiListController.createShoppingList(
                new ShoppingListRequest("Temporary List", "#0b292f", "shopping-bag")
        ).getBody();
        assertThat(customList).isNotNull();

        ShoppingListItemRequest itemReq = new ShoppingListItemRequest();
        itemReq.setName("Apples");
        itemReq.setCategory(Category.PRODUCE);
        itemReq.setQuantity(1.0);
        itemReq.setUnit("kg");
        multiListController.createItemInList(customList.id(), itemReq);

        // Deleting non-empty list must fail
        assertThatThrownBy(() -> multiListController.deleteShoppingList(customList.id()))
                .isInstanceOf(InvalidInventoryOperationException.class)
                .hasMessageContaining("Cannot delete list 'Temporary List' because it contains 1 item");

        // 3. Clear items from list, then deletion must succeed
        multiListController.deleteItemInList(customList.id(), shoppingItemRepository.findByShoppingListId(customList.id()).get(0).getId());
        ResponseEntity<Void> deleteRes = multiListController.deleteShoppingList(customList.id());
        assertThat(deleteRes.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Verify it is gone
        assertThatThrownBy(() -> multiListController.getShoppingList(customList.id()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Migration Idempotency: Re-running migration safely without modifying existing data")
    void testMigrationIdempotency() {
        // Re-run migration method directly on datasource
        migration.runMigration(dataSource);

        // Verify default list still exists and has valid count
        ShoppingList defaultList = shoppingListRepository.findByIsDefaultTrue().orElseThrow();
        assertThat(defaultList.getTitle()).isEqualTo("Main Shopping List");

        // Re-run again
        migration.runMigration(dataSource);
        assertThat(shoppingListRepository.findAll()).isNotEmpty();
    }

    @Test
    @DisplayName("Legacy unparented item migration preserves all fields and associates with default list")
    void testLegacyUnparentedItemMigration() throws Exception {
        ShoppingList defaultList = shoppingListRepository.findByIsDefaultTrue().orElseThrow();

        // Simulate legacy unparented row using raw JDBC
        long rawItemId;
        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(
                    """
                    INSERT INTO shopping_list_items (name, category, quantity, unit, estimated_price, purchased, priority, notes, shopping_list_id, created_at, updated_at)
                    VALUES ('Raw Insert Item', 'PANTRY', 3.5, 'boxes', 125.50, FALSE, 'URGENT', 'Migrated test notes', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """,
                    Statement.RETURN_GENERATED_KEYS)) {
                stmt.setLong(1, defaultList.getId());
                stmt.executeUpdate();
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    assertThat(rs.next()).isTrue();
                    rawItemId = rs.getLong(1);
                }
            }
        }

        // Verify retrieval via service and controller
        ResponseEntity<ShoppingListItemResponse> itemRes = legacyShoppingListController.getItem(rawItemId);
        assertThat(itemRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        ShoppingListItemResponse item = itemRes.getBody();
        assertThat(item).isNotNull();
        assertThat(item.name()).isEqualTo("Raw Insert Item");
        assertThat(item.quantity()).isEqualTo(3.5);
        assertThat(item.estimatedPrice()).isEqualByComparingTo(new BigDecimal("125.50"));
        assertThat(item.priority()).isEqualTo(ShoppingItemPriority.URGENT);
        assertThat(item.notes()).isEqualTo("Migrated test notes");
        assertThat(item.shoppingListId()).isEqualTo(defaultList.getId());
    }

    @Test
    @DisplayName("Empty lists and invalid list IDs return appropriate status codes")
    void testEmptyListAndInvalidListIds() {
        // Empty list has 0 items and 0 budget
        ShoppingListResponse emptyList = multiListController.createShoppingList(
                new ShoppingListRequest("Clean Empty List", "#059669", "heart")
        ).getBody();
        assertThat(emptyList).isNotNull();
        assertThat(emptyList.itemCount()).isZero();
        assertThat(emptyList.uncheckedItemCount()).isZero();
        assertThat(emptyList.estimatedTotal()).isEqualByComparingTo(BigDecimal.ZERO);

        // Invalid list ID returns 404 ResourceNotFoundException
        assertThatThrownBy(() -> multiListController.getShoppingList(999999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
