package com.smartfridge.service;

import com.smartfridge.dto.DashboardSummaryResponse;
import com.smartfridge.dto.GroceryItemRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.dto.LowStockSuggestion;
import com.smartfridge.dto.QuantityActionType;
import com.smartfridge.dto.QuantityAdjustmentRequest;
import com.smartfridge.dto.ShoppingBudgetSummary;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.ExpiryStatus;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.exception.InvalidInventoryOperationException;
import com.smartfridge.exception.ResourceNotFoundException;
import com.smartfridge.repository.GroceryItemRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryService {

    private final GroceryItemRepository repository;
    private final ExpiryStatusService expiryStatusService;
    private final ShoppingListService shoppingListService;

    public InventoryService(
            GroceryItemRepository repository,
            ExpiryStatusService expiryStatusService,
            ShoppingListService shoppingListService
    ) {
        this.repository = repository;
        this.expiryStatusService = expiryStatusService;
        this.shoppingListService = shoppingListService;
    }

    @Transactional(readOnly = true)
    public List<GroceryItemResponse> listItems(
            String search,
            Category category,
            StorageLocation storageLocation,
            String sortBy,
            String sortDir
    ) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        boolean descending = "desc".equalsIgnoreCase(sortDir);

        Comparator<GroceryItem> comparator = buildComparator(sortBy, descending);

        return repository.findAll().stream()
                .filter(item -> normalizedSearch.isEmpty()
                        || item.getProductName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .filter(item -> category == null || item.getCategory() == category)
                .filter(item -> storageLocation == null || item.getStorageLocation() == storageLocation)
                .sorted(comparator)
                .map(item -> GroceryItemResponse.fromEntity(item, expiryStatusService))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroceryItemResponse> listByExpiry(ExpiryStatus status) {
        return repository.findAll().stream()
                .map(item -> GroceryItemResponse.fromEntity(item, expiryStatusService))
                .filter(res -> status == null || res.expiryStatus() == status)
                .sorted(Comparator.comparing(
                        GroceryItemResponse::daysUntilExpiry,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).thenComparing(item -> item.productName().toLowerCase(Locale.ROOT)))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroceryItemResponse getItem(Long id) {
        GroceryItem item = findByIdOrThrow(id);
        return GroceryItemResponse.fromEntity(item, expiryStatusService);
    }

    public GroceryItemResponse createItem(GroceryItemRequest request) {
        validateLogicalFields(request);
        GroceryItem item = new GroceryItem();
        applyRequestToEntity(request, item);
        GroceryItem saved = repository.save(item);
        return GroceryItemResponse.fromEntity(saved, expiryStatusService);
    }

    public GroceryItemResponse updateItem(Long id, GroceryItemRequest request) {
        validateLogicalFields(request);
        GroceryItem item = findByIdOrThrow(id);
        applyRequestToEntity(request, item);
        GroceryItem saved = repository.save(item);
        return GroceryItemResponse.fromEntity(saved, expiryStatusService);
    }

    public void deleteItem(Long id) {
        GroceryItem item = findByIdOrThrow(id);
        repository.delete(item);
    }

    public GroceryItemResponse adjustQuantity(Long id, QuantityAdjustmentRequest request) {
        GroceryItem item = findByIdOrThrow(id);
        QuantityActionType action = request.getAction();
        Double amount = request.getAmount();
        double currentQty = item.getQuantity() == null ? 0.0 : item.getQuantity();

        double updatedQty;
        switch (action) {
            case USE -> {
                if (amount == null || amount <= 0) {
                    throw new InvalidInventoryOperationException("Use amount must be greater than zero");
                }
                updatedQty = roundQuantity(currentQty - amount);
                if (updatedQty < 0) {
                    throw new InvalidInventoryOperationException(
                            "Cannot use " + amount + " " + item.getUnit()
                                    + " — only " + currentQty + " " + item.getUnit() + " available"
                    );
                }
            }
            case FINISH -> updatedQty = 0.0;
            case RESTOCK -> {
                if (amount == null || amount <= 0) {
                    throw new InvalidInventoryOperationException("Restock amount must be greater than zero");
                }
                updatedQty = roundQuantity(currentQty + amount);
            }
            case CORRECT -> {
                if (amount == null || amount < 0) {
                    throw new InvalidInventoryOperationException("Corrected quantity cannot be negative");
                }
                updatedQty = roundQuantity(amount);
            }
            default -> throw new InvalidInventoryOperationException("Unsupported quantity action");
        }

        item.setQuantity(updatedQty);
        GroceryItem saved = repository.save(item);
        return GroceryItemResponse.fromEntity(saved, expiryStatusService);
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        List<GroceryItem> allItems = repository.findAll();
        long totalInventoryCount = allItems.size();

        // Map items with in-stock quantities (> 0) to evaluate expiry sections
        List<GroceryItemResponse> inStockResponses = allItems.stream()
                .filter(item -> item.getQuantity() != null && item.getQuantity() > 0)
                .map(item -> GroceryItemResponse.fromEntity(item, expiryStatusService))
                .toList();

        List<GroceryItemResponse> expiredItems = inStockResponses.stream()
                .filter(item -> item.expiryStatus() == ExpiryStatus.EXPIRED)
                .sorted(Comparator.comparing(
                        GroceryItemResponse::daysUntilExpiry,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();

        List<GroceryItemResponse> expiringTodayItems = inStockResponses.stream()
                .filter(item -> item.expiryStatus() == ExpiryStatus.EXPIRES_TODAY)
                .toList();

        List<GroceryItemResponse> expiringSoonItems = inStockResponses.stream()
                .filter(item -> item.expiryStatus() == ExpiryStatus.EXPIRING_SOON)
                .sorted(Comparator.comparing(
                        GroceryItemResponse::daysUntilExpiry,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();

        List<GroceryItem> lowStockEntities = allItems.stream()
                .filter(item -> item.getQuantity() <= item.getMinimumStockThreshold())
                .sorted(Comparator.comparing(GroceryItem::getQuantity))
                .toList();

        List<GroceryItemResponse> recentlyUpdated = allItems.stream()
                .sorted(Comparator.comparing(GroceryItem::getUpdatedAt).reversed())
                .limit(6)
                .map(item -> GroceryItemResponse.fromEntity(item, expiryStatusService))
                .toList();

        List<ShoppingListItemResponse> upcomingShoppingList = shoppingListService.listItems(
                null, null, null, false, "priority", "desc"
        ).stream().limit(6).toList();

        List<LowStockSuggestion> lowStockSuggestions = shoppingListService.getLowStockSuggestions();
        ShoppingBudgetSummary budgetSummary = shoppingListService.getBudgetSummary();

        return new DashboardSummaryResponse(
                totalInventoryCount,
                expiredItems.size(),
                expiringTodayItems.size(),
                expiringSoonItems.size(),
                lowStockEntities.size(),
                budgetSummary.totalUncheckedCount(),
                recentlyUpdated,
                expiredItems,
                expiringTodayItems,
                expiringSoonItems,
                upcomingShoppingList,
                lowStockSuggestions,
                budgetSummary
        );
    }

    private GroceryItem findByIdOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grocery item not found with id: " + id));
    }

    private void validateLogicalFields(GroceryItemRequest request) {
        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new InvalidInventoryOperationException("Quantity cannot be negative");
        }
        if (request.getMinimumStockThreshold() != null && request.getMinimumStockThreshold() < 0) {
            throw new InvalidInventoryOperationException("Minimum stock threshold cannot be negative");
        }
    }

    private void applyRequestToEntity(GroceryItemRequest request, GroceryItem item) {
        item.setProductName(request.getProductName().trim());
        item.setCategory(request.getCategory());
        item.setQuantity(roundQuantity(request.getQuantity()));
        item.setUnit(request.getUnit().trim());
        item.setStorageLocation(request.getStorageLocation());
        item.setMinimumStockThreshold(roundQuantity(request.getMinimumStockThreshold()));
        item.setPurchaseDate(request.getPurchaseDate());

        item.setExpiryDate(request.getExpiryDate());
        if (request.getExpiryDate() == null) {
            item.setExpirySource(null);
        } else {
            item.setExpirySource(request.getExpirySource() != null
                    ? request.getExpirySource()
                    : ExpirySource.ESTIMATED);
        }

        item.setPrice(request.getPrice());
        item.setNotes(request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes().trim()
                : null);
    }

    private Comparator<GroceryItem> buildComparator(String sortBy, boolean descending) {
        Comparator<GroceryItem> comparator;
        if ("quantity".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparing(GroceryItem::getQuantity)
                    .thenComparing(item -> item.getProductName().toLowerCase(Locale.ROOT));
        } else if ("name".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparing(
                    (GroceryItem item) -> item.getProductName().toLowerCase(Locale.ROOT)
            );
        } else {
            // Default sort by expiryDate (nulls last)
            comparator = Comparator.comparing(
                    GroceryItem::getExpiryDate,
                    Comparator.nullsLast(Comparator.naturalOrder())
            ).thenComparing(item -> item.getProductName().toLowerCase(Locale.ROOT));
        }
        return descending ? comparator.reversed() : comparator;
    }

    private double roundQuantity(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
