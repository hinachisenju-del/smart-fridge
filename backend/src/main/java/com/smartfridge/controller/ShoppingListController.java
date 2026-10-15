package com.smartfridge.controller;

import com.smartfridge.dto.AddFromInventoryRequest;
import com.smartfridge.dto.ConvertPurchasedToInventoryRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.dto.LowStockSuggestion;
import com.smartfridge.dto.ShoppingBudgetSummary;
import com.smartfridge.dto.ShoppingListItemRequest;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ShoppingItemPriority;
import com.smartfridge.service.ShoppingListService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shopping-list")
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    public ShoppingListController(ShoppingListService shoppingListService) {
        this.shoppingListService = shoppingListService;
    }

    @GetMapping
    public ResponseEntity<List<ShoppingListItemResponse>> listItems(
            @RequestParam(required = false) Long listId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) ShoppingItemPriority priority,
            @RequestParam(required = false) Boolean purchased,
            @RequestParam(required = false, defaultValue = "name") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(
                shoppingListService.listItems(listId, search, category, priority, purchased, sortBy, sortDir)
        );
    }

    public ResponseEntity<List<ShoppingListItemResponse>> listItems(
            String search,
            Category category,
            ShoppingItemPriority priority,
            Boolean purchased,
            String sortBy,
            String sortDir
    ) {
        return listItems(null, search, category, priority, purchased, sortBy, sortDir);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShoppingListItemResponse> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(shoppingListService.getItem(id));
    }

    @PostMapping
    public ResponseEntity<ShoppingListItemResponse> createItem(
            @Valid @RequestBody ShoppingListItemRequest request
    ) {
        ShoppingListItemResponse created = shoppingListService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShoppingListItemResponse> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ShoppingListItemRequest request
    ) {
        return ResponseEntity.ok(shoppingListService.updateItem(id, request));
    }

    @PatchMapping("/{id}/purchased")
    public ResponseEntity<ShoppingListItemResponse> togglePurchased(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Boolean> body
    ) {
        Boolean purchased = body != null ? body.get("purchased") : null;
        return ResponseEntity.ok(shoppingListService.togglePurchased(id, purchased));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        shoppingListService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/purchased")
    public ResponseEntity<Map<String, Object>> clearPurchased(
            @RequestParam(required = false) Long listId
    ) {
        long clearedCount = shoppingListService.clearPurchased(listId);
        return ResponseEntity.ok(Map.of("clearedCount", clearedCount));
    }

    public ResponseEntity<Map<String, Object>> clearPurchased() {
        return clearPurchased(null);
    }

    @GetMapping("/budget")
    public ResponseEntity<ShoppingBudgetSummary> getBudgetSummary(
            @RequestParam(required = false) Long listId
    ) {
        return ResponseEntity.ok(shoppingListService.getBudgetSummary(listId));
    }

    public ResponseEntity<ShoppingBudgetSummary> getBudgetSummary() {
        return getBudgetSummary(null);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<LowStockSuggestion>> getLowStockSuggestions() {
        return ResponseEntity.ok(shoppingListService.getLowStockSuggestions());
    }

    @PostMapping("/from-inventory/{inventoryItemId}")
    public ResponseEntity<ShoppingListItemResponse> addFromInventory(
            @PathVariable Long inventoryItemId,
            @RequestBody(required = false) AddFromInventoryRequest request
    ) {
        ShoppingListItemResponse response = shoppingListService.addFromInventory(inventoryItemId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/convert-to-inventory")
    public ResponseEntity<GroceryItemResponse> convertPurchasedToInventory(
            @PathVariable Long id,
            @RequestBody(required = false) ConvertPurchasedToInventoryRequest request
    ) {
        GroceryItemResponse response = shoppingListService.convertPurchasedToInventory(id, request);
        return ResponseEntity.ok(response);
    }
}
