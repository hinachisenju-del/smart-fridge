package com.smartfridge.controller;

import com.smartfridge.dto.ShoppingBudgetSummary;
import com.smartfridge.dto.ShoppingListItemRequest;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.dto.ShoppingListRequest;
import com.smartfridge.dto.ShoppingListResponse;
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
@RequestMapping("/api/shopping-lists")
public class MultiShoppingListController {

    private final ShoppingListService shoppingListService;

    public MultiShoppingListController(ShoppingListService shoppingListService) {
        this.shoppingListService = shoppingListService;
    }

    @GetMapping
    public ResponseEntity<List<ShoppingListResponse>> listShoppingLists(
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived
    ) {
        return ResponseEntity.ok(shoppingListService.listShoppingLists(includeArchived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShoppingListResponse> getShoppingList(@PathVariable Long id) {
        return ResponseEntity.ok(shoppingListService.getShoppingList(id));
    }

    @PostMapping
    public ResponseEntity<ShoppingListResponse> createShoppingList(
            @Valid @RequestBody ShoppingListRequest request
    ) {
        ShoppingListResponse created = shoppingListService.createShoppingList(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShoppingListResponse> updateShoppingList(
            @PathVariable Long id,
            @Valid @RequestBody ShoppingListRequest request
    ) {
        return ResponseEntity.ok(shoppingListService.updateShoppingList(id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ShoppingListResponse> archiveShoppingList(@PathVariable Long id) {
        return ResponseEntity.ok(shoppingListService.archiveShoppingList(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ShoppingListResponse> restoreShoppingList(@PathVariable Long id) {
        return ResponseEntity.ok(shoppingListService.restoreShoppingList(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShoppingList(@PathVariable Long id) {
        shoppingListService.deleteShoppingList(id);
        return ResponseEntity.noContent().build();
    }

    // List-scoped item operations
    @GetMapping("/{id}/items")
    public ResponseEntity<List<ShoppingListItemResponse>> listItemsInList(
            @PathVariable Long id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) ShoppingItemPriority priority,
            @RequestParam(required = false) Boolean purchased,
            @RequestParam(required = false, defaultValue = "name") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(shoppingListService.listItems(id, search, category, priority, purchased, sortBy, sortDir));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ShoppingListItemResponse> createItemInList(
            @PathVariable Long id,
            @Valid @RequestBody ShoppingListItemRequest request
    ) {
        ShoppingListItemResponse created = shoppingListService.createItemInList(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/items/{itemId}")
    public ResponseEntity<ShoppingListItemResponse> getItemInList(
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(shoppingListService.getItemInList(id, itemId));
    }

    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<ShoppingListItemResponse> updateItemInList(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody ShoppingListItemRequest request
    ) {
        return ResponseEntity.ok(shoppingListService.updateItemInList(id, itemId, request));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<Void> deleteItemInList(
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        shoppingListService.deleteItemInList(id, itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/purchased")
    public ResponseEntity<Map<String, Object>> clearPurchasedInList(@PathVariable Long id) {
        long cleared = shoppingListService.clearPurchased(id);
        return ResponseEntity.ok(Map.of("clearedCount", cleared));
    }

    @GetMapping("/{id}/budget")
    public ResponseEntity<ShoppingBudgetSummary> getBudgetForList(@PathVariable Long id) {
        return ResponseEntity.ok(shoppingListService.getBudgetSummary(id));
    }
}
