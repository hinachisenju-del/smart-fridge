package com.smartfridge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartfridge.controller.ShoppingListController;
import com.smartfridge.dto.AddFromInventoryRequest;
import com.smartfridge.dto.ConvertPurchasedToInventoryRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.dto.LowStockSuggestion;
import com.smartfridge.dto.ShoppingBudgetSummary;
import com.smartfridge.dto.ShoppingListItemRequest;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.entity.ShoppingItemPriority;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.exception.InvalidInventoryOperationException;
import com.smartfridge.exception.ResourceNotFoundException;
import com.smartfridge.repository.GroceryItemRepository;
import com.smartfridge.repository.ShoppingListItemRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest
class ShoppingListIntegrationTests {

    @Autowired
    private ShoppingListController shoppingListController;

    @Autowired
    private ShoppingListItemRepository shoppingRepository;

    @Autowired
    private GroceryItemRepository groceryRepository;

    @Autowired
    private Validator validator;

    @BeforeEach
    void setUp() {
        shoppingRepository.deleteAll();
        groceryRepository.deleteAll();
    }

    @Test
    @DisplayName("CRUD: Create, Read, Update, and Delete shopping list items")
    void testShoppingListCrudOperations() {
        // 1. Create
        ShoppingListItemRequest req = new ShoppingListItemRequest();
        req.setName("Oat Milk");
        req.setCategory(Category.DAIRY);
        req.setQuantity(2.0);
        req.setUnit("cartons");
        req.setEstimatedPrice(new BigDecimal("120.00"));
        req.setPriority(ShoppingItemPriority.HIGH);
        req.setNotes("Barista edition");

        ResponseEntity<ShoppingListItemResponse> createRes = shoppingListController.createItem(req);
        assertThat(createRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ShoppingListItemResponse created = createRes.getBody();
        assertThat(created).isNotNull();
        assertThat(created.id()).isNotNull();
        assertThat(created.name()).isEqualTo("Oat Milk");
        assertThat(created.priority()).isEqualTo(ShoppingItemPriority.HIGH);
        assertThat(created.purchased()).isFalse();

        // 2. Read
        ResponseEntity<ShoppingListItemResponse> getRes = shoppingListController.getItem(created.id());
        assertThat(getRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getRes.getBody()).isNotNull();
        assertThat(getRes.getBody().name()).isEqualTo("Oat Milk");

        // 3. Update
        req.setName("Organic Oat Milk");
        req.setQuantity(3.0);
        req.setEstimatedPrice(new BigDecimal("130.00"));
        req.setPriority(ShoppingItemPriority.URGENT);

        ResponseEntity<ShoppingListItemResponse> updateRes = shoppingListController.updateItem(created.id(), req);
        assertThat(updateRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        ShoppingListItemResponse updated = updateRes.getBody();
        assertThat(updated).isNotNull();
        assertThat(updated.name()).isEqualTo("Organic Oat Milk");
        assertThat(updated.quantity()).isEqualTo(3.0);
        assertThat(updated.priority()).isEqualTo(ShoppingItemPriority.URGENT);

        // 4. Delete
        ResponseEntity<Void> deleteRes = shoppingListController.deleteItem(created.id());
        assertThat(deleteRes.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(shoppingRepository.count()).isZero();
    }

    @Test
    @DisplayName("Toggle purchased and clear purchased items")
    void testMarkPurchasedAndClearPurchased() {
        ShoppingListItemRequest req1 = buildSampleItem("Bread", Category.BAKERY, 1.0, "loaf", new BigDecimal("45.00"));
        ShoppingListItemRequest req2 = buildSampleItem("Apples", Category.PRODUCE, 6.0, "pcs", new BigDecimal("150.00"));

        ShoppingListItemResponse item1 = shoppingListController.createItem(req1).getBody();
        ShoppingListItemResponse item2 = shoppingListController.createItem(req2).getBody();
        assertThat(item1).isNotNull();
        assertThat(item2).isNotNull();

        // Mark item1 as purchased
        ShoppingListItemResponse toggled1 = shoppingListController.togglePurchased(
                item1.id(), Map.of("purchased", true)
        ).getBody();
        assertThat(toggled1).isNotNull();
        assertThat(toggled1.purchased()).isTrue();

        // Verify separate listing by purchased status
        List<ShoppingListItemResponse> unpurchased = shoppingListController.listItems(
                null, null, null, false, "name", "asc"
        ).getBody();
        assertThat(unpurchased).hasSize(1);
        assertThat(unpurchased.get(0).name()).isEqualTo("Apples");

        List<ShoppingListItemResponse> purchased = shoppingListController.listItems(
                null, null, null, true, "name", "asc"
        ).getBody();
        assertThat(purchased).hasSize(1);
        assertThat(purchased.get(0).name()).isEqualTo("Bread");

        // Mark item1 unpurchased again
        ShoppingListItemResponse unpurchased1 = shoppingListController.togglePurchased(
                item1.id(), Map.of("purchased", false)
        ).getBody();
        assertThat(unpurchased1).isNotNull();
        assertThat(unpurchased1.purchased()).isFalse();

        // Re-purchase item2 and test clearPurchased
        shoppingListController.togglePurchased(item2.id(), Map.of("purchased", true));
        ResponseEntity<Map<String, Object>> clearRes = shoppingListController.clearPurchased();
        assertThat(clearRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(clearRes.getBody()).containsEntry("clearedCount", 1L);

        // Only item1 remains
        assertThat(shoppingRepository.count()).isEqualTo(1);
        assertThat(shoppingRepository.findAll().get(0).getName()).isEqualTo("Bread");
    }

    @Test
    @DisplayName("Validation and missing item error handling")
    void testValidationAndNotFoundErrors() {
        // Invalid request: blank name, zero quantity, negative price
        ShoppingListItemRequest invalidReq = new ShoppingListItemRequest();
        invalidReq.setName("   ");
        invalidReq.setCategory(Category.DAIRY);
        invalidReq.setQuantity(0.0);
        invalidReq.setUnit("units");
        invalidReq.setEstimatedPrice(new BigDecimal("-10.00"));

        Set<ConstraintViolation<ShoppingListItemRequest>> violations = validator.validate(invalidReq);
        assertThat(violations).isNotEmpty();

        // Missing item 404
        assertThatThrownBy(() -> shoppingListController.getItem(99999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99999");
    }

    @Test
    @DisplayName("Budget summary accurately calculates totals and identifies items without price")
    void testBudgetSummaryCalculation() {
        // Item 1: Unchecked with price (2 * 100 = 200)
        shoppingListController.createItem(buildSampleItem("Almond Butter", Category.PANTRY, 2.0, "jars", new BigDecimal("100.00")));

        // Item 2: Unchecked WITHOUT price
        shoppingListController.createItem(buildSampleItem("Cinnamon Sticks", Category.PANTRY, 1.0, "pack", null));

        // Item 3: Checked with price (3 * 50 = 150)
        ShoppingListItemResponse checkedWithPrice = shoppingListController.createItem(
                buildSampleItem("Greek Yogurt", Category.DAIRY, 3.0, "cups", new BigDecimal("50.00"))
        ).getBody();
        assertThat(checkedWithPrice).isNotNull();
        shoppingListController.togglePurchased(checkedWithPrice.id(), Map.of("purchased", true));

        // Item 4: Checked WITHOUT price
        ShoppingListItemResponse checkedWithoutPrice = shoppingListController.createItem(
                buildSampleItem("Napkins", Category.OTHER, 1.0, "pack", null)
        ).getBody();
        assertThat(checkedWithoutPrice).isNotNull();
        shoppingListController.togglePurchased(checkedWithoutPrice.id(), Map.of("purchased", true));

        ShoppingBudgetSummary budget = shoppingListController.getBudgetSummary().getBody();
        assertThat(budget).isNotNull();

        assertThat(budget.uncheckedEstimatedTotal()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(budget.uncheckedItemsWithPriceCount()).isEqualTo(1);
        assertThat(budget.uncheckedItemsWithoutPriceCount()).isEqualTo(1);
        assertThat(budget.totalUncheckedCount()).isEqualTo(2);

        assertThat(budget.checkedEstimatedTotal()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(budget.checkedItemsWithPriceCount()).isEqualTo(1);
        assertThat(budget.checkedItemsWithoutPriceCount()).isEqualTo(1);
        assertThat(budget.totalCheckedCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("Inventory integration: add to shopping list directly and avoid duplicate suggestions")
    void testInventoryToShoppingListIntegrationAndSuggestions() {
        // 1. Create a low-stock grocery item
        GroceryItem grocery = new GroceryItem();
        grocery.setProductName("Organic Eggs");
        grocery.setCategory(Category.DAIRY);
        grocery.setQuantity(1.0);
        grocery.setUnit("carton");
        grocery.setStorageLocation(StorageLocation.MIDDLE_SHELF);
        grocery.setMinimumStockThreshold(2.0);
        grocery.setPurchaseDate(LocalDate.now());
        grocery.setExpiryDate(LocalDate.now().plusDays(7));
        grocery.setExpirySource(ExpirySource.CONFIRMED);
        grocery.setPrice(new BigDecimal("90.00"));
        GroceryItem savedGrocery = groceryRepository.save(grocery);

        // 2. Check low-stock suggestions before adding
        List<LowStockSuggestion> suggestionsBefore = shoppingListController.getLowStockSuggestions().getBody();
        assertThat(suggestionsBefore).hasSize(1);
        assertThat(suggestionsBefore.get(0).name()).isEqualTo("Organic Eggs");
        assertThat(suggestionsBefore.get(0).suggestedQuantity()).isEqualTo(1.0);
        assertThat(suggestionsBefore.get(0).alreadyInShoppingList()).isFalse();

        // 3. Add to shopping list from inventory with chosen restock quantity
        AddFromInventoryRequest addReq = new AddFromInventoryRequest();
        addReq.setQuantityToBuy(2.0);
        addReq.setPriority(ShoppingItemPriority.URGENT);

        ResponseEntity<ShoppingListItemResponse> addRes =
                shoppingListController.addFromInventory(savedGrocery.getId(), addReq);
        assertThat(addRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ShoppingListItemResponse shoppingItem = addRes.getBody();
        assertThat(shoppingItem).isNotNull();
        assertThat(shoppingItem.name()).isEqualTo("Organic Eggs");
        assertThat(shoppingItem.quantity()).isEqualTo(2.0);
        assertThat(shoppingItem.priority()).isEqualTo(ShoppingItemPriority.URGENT);
        assertThat(shoppingItem.inventoryItemId()).isEqualTo(savedGrocery.getId());

        // 4. Verify suggestions now show alreadyInShoppingList = true to prevent duplicate suggestions
        List<LowStockSuggestion> suggestionsAfter = shoppingListController.getLowStockSuggestions().getBody();
        assertThat(suggestionsAfter).hasSize(1);
        assertThat(suggestionsAfter.get(0).alreadyInShoppingList()).isTrue();

        // 5. Test adding from inventory again increments existing quantity instead of creating duplicate
        shoppingListController.addFromInventory(savedGrocery.getId(), addReq);
        List<ShoppingListItemResponse> allItems = shoppingListController.listItems(
                null, null, null, false, "name", "asc"
        ).getBody();
        assertThat(allItems).hasSize(1);
        assertThat(allItems.get(0).quantity()).isEqualTo(4.0); // 2.0 + 2.0
    }

    @Test
    @DisplayName("Explicitly convert purchased shopping item to inventory without duplicate grocery records")
    void testConvertPurchasedShoppingItemToInventory() {
        // Create an initial grocery item in fridge
        GroceryItem initialGrocery = new GroceryItem();
        initialGrocery.setProductName("Cold Pressed Orange Juice");
        initialGrocery.setCategory(Category.BEVERAGES);
        initialGrocery.setQuantity(1.0);
        initialGrocery.setUnit("bottles");
        initialGrocery.setStorageLocation(StorageLocation.DOOR_BIN);
        initialGrocery.setMinimumStockThreshold(2.0);
        initialGrocery.setPurchaseDate(LocalDate.now());
        initialGrocery.setExpiryDate(LocalDate.now().plusDays(5));
        initialGrocery.setExpirySource(ExpirySource.CONFIRMED);
        initialGrocery.setPrice(new BigDecimal("110.00"));
        GroceryItem savedInitial = groceryRepository.save(initialGrocery);

        // Add to shopping list linked to this grocery
        AddFromInventoryRequest addReq = new AddFromInventoryRequest();
        addReq.setQuantityToBuy(2.0);
        ShoppingListItemResponse shoppingItem =
                shoppingListController.addFromInventory(savedInitial.getId(), addReq).getBody();
        assertThat(shoppingItem).isNotNull();

        // Prevent converting unpurchased item
        ConvertPurchasedToInventoryRequest convertReq = new ConvertPurchasedToInventoryRequest();
        convertReq.setStorageLocation(StorageLocation.DOOR_BIN);
        convertReq.setRemoveFromShoppingList(true);

        assertThatThrownBy(() -> shoppingListController.convertPurchasedToInventory(shoppingItem.id(), convertReq))
                .isInstanceOf(InvalidInventoryOperationException.class)
                .hasMessageContaining("Mark it as purchased first");

        // Mark purchased
        shoppingListController.togglePurchased(shoppingItem.id(), Map.of("purchased", true));

        // Convert to inventory
        ResponseEntity<GroceryItemResponse> convertedRes =
                shoppingListController.convertPurchasedToInventory(shoppingItem.id(), convertReq);
        assertThat(convertedRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        GroceryItemResponse converted = convertedRes.getBody();
        assertThat(converted).isNotNull();
        assertThat(converted.id()).isEqualTo(savedInitial.getId()); // Reuses existing record!
        assertThat(converted.quantity()).isEqualTo(3.0); // 1.0 existing + 2.0 bought

        // Verify no duplicate grocery created
        assertThat(groceryRepository.count()).isEqualTo(1);

        // Verify shopping item was removed because removeFromShoppingList was true
        assertThat(shoppingRepository.count()).isZero();
    }

    private ShoppingListItemRequest buildSampleItem(
            String name,
            Category category,
            Double quantity,
            String unit,
            BigDecimal price
    ) {
        ShoppingListItemRequest req = new ShoppingListItemRequest();
        req.setName(name);
        req.setCategory(category);
        req.setQuantity(quantity);
        req.setUnit(unit);
        req.setEstimatedPrice(price);
        req.setPriority(ShoppingItemPriority.MEDIUM);
        return req;
    }
}
