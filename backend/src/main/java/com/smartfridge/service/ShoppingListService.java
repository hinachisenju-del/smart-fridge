package com.smartfridge.service;

import com.smartfridge.dto.AddFromInventoryRequest;
import com.smartfridge.dto.ConvertPurchasedToInventoryRequest;
import com.smartfridge.dto.GroceryItemResponse;
import com.smartfridge.dto.LowStockSuggestion;
import com.smartfridge.dto.ShoppingBudgetSummary;
import com.smartfridge.dto.ShoppingListItemRequest;
import com.smartfridge.dto.ShoppingListItemResponse;
import com.smartfridge.dto.ShoppingListRequest;
import com.smartfridge.dto.ShoppingListResponse;
import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.GroceryItem;
import com.smartfridge.entity.ShoppingItemPriority;
import com.smartfridge.entity.ShoppingList;
import com.smartfridge.entity.ShoppingListItem;
import com.smartfridge.entity.StorageLocation;
import com.smartfridge.exception.InvalidInventoryOperationException;
import com.smartfridge.exception.ResourceNotFoundException;
import com.smartfridge.repository.GroceryItemRepository;
import com.smartfridge.repository.ShoppingListItemRepository;
import com.smartfridge.repository.ShoppingListRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListItemRepository shoppingRepository;
    private final GroceryItemRepository groceryRepository;
    private final ExpiryStatusService expiryStatusService;

    public ShoppingListService(
            ShoppingListRepository shoppingListRepository,
            ShoppingListItemRepository shoppingRepository,
            GroceryItemRepository groceryRepository,
            ExpiryStatusService expiryStatusService
    ) {
        this.shoppingListRepository = shoppingListRepository;
        this.shoppingRepository = shoppingRepository;
        this.groceryRepository = groceryRepository;
        this.expiryStatusService = expiryStatusService;
    }

    // =========================================================================
    // Multi-List Management Operations
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ShoppingListResponse> listShoppingLists(boolean includeArchived) {
        List<ShoppingList> lists = includeArchived
                ? shoppingListRepository.findAll()
                : shoppingListRepository.findByIsArchivedFalseOrderByCreatedAtAsc();

        // Sort: default list first, then active/archived ordered by created date
        return lists.stream()
                .sorted(Comparator.comparing(ShoppingList::isDefault).reversed()
                        .thenComparing(ShoppingList::getCreatedAt))
                .map(list -> ShoppingListResponse.fromEntity(list, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ShoppingListResponse getShoppingList(Long id) {
        ShoppingList list = findShoppingListByIdOrThrow(id);
        return ShoppingListResponse.fromEntity(list, true);
    }

    public ShoppingListResponse createShoppingList(ShoppingListRequest request) {
        validateListRequest(request);
        String cleanTitle = request.getTitle().trim();

        if (shoppingListRepository.existsByTitleIgnoreCase(cleanTitle)) {
            throw new InvalidInventoryOperationException("A shopping list with title '" + cleanTitle + "' already exists");
        }

        ShoppingList list = new ShoppingList(
                cleanTitle,
                request.getColor(),
                request.getIcon(),
                false
        );

        ShoppingList saved = shoppingListRepository.save(list);
        return ShoppingListResponse.fromEntity(saved, true);
    }

    public ShoppingListResponse updateShoppingList(Long id, ShoppingListRequest request) {
        validateListRequest(request);
        ShoppingList list = findShoppingListByIdOrThrow(id);
        String cleanTitle = request.getTitle().trim();

        if (shoppingListRepository.existsByTitleIgnoreCaseAndIdNot(cleanTitle, id)) {
            throw new InvalidInventoryOperationException("Another shopping list with title '" + cleanTitle + "' already exists");
        }

        list.setTitle(cleanTitle);
        if (request.getColor() != null && !request.getColor().isBlank()) {
            list.setColor(request.getColor().trim());
        }
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            list.setIcon(request.getIcon().trim());
        }

        ShoppingList saved = shoppingListRepository.save(list);
        return ShoppingListResponse.fromEntity(saved, true);
    }

    public ShoppingListResponse archiveShoppingList(Long id) {
        ShoppingList list = findShoppingListByIdOrThrow(id);
        if (list.isDefault()) {
            throw new InvalidInventoryOperationException("The default shopping list cannot be archived.");
        }
        list.setArchived(true);
        ShoppingList saved = shoppingListRepository.save(list);
        return ShoppingListResponse.fromEntity(saved, true);
    }

    public ShoppingListResponse restoreShoppingList(Long id) {
        ShoppingList list = findShoppingListByIdOrThrow(id);
        list.setArchived(false);
        ShoppingList saved = shoppingListRepository.save(list);
        return ShoppingListResponse.fromEntity(saved, true);
    }

    public void deleteShoppingList(Long id) {
        ShoppingList list = findShoppingListByIdOrThrow(id);

        if (list.isDefault()) {
            throw new InvalidInventoryOperationException("The default shopping list cannot be deleted.");
        }

        long itemCount = shoppingRepository.countByShoppingListId(id);
        if (itemCount > 0) {
            throw new InvalidInventoryOperationException(String.format(
                    "Cannot delete list '%s' because it contains %d item(s). Move or delete the items first, or archive the list.",
                    list.getTitle(), itemCount
            ));
        }

        shoppingListRepository.delete(list);
    }

    public ShoppingList getOrCreateDefaultList() {
        Optional<ShoppingList> defaultOpt = shoppingListRepository.findByIsDefaultTrue();
        if (defaultOpt.isPresent()) {
            return defaultOpt.get();
        }

        Optional<ShoppingList> firstActive = shoppingListRepository.findFirstByIsArchivedFalseOrderByCreatedAtAsc();
        if (firstActive.isPresent()) {
            ShoppingList list = firstActive.get();
            list.setDefault(true);
            return shoppingListRepository.save(list);
        }

        Optional<ShoppingList> anyList = shoppingListRepository.findFirstByOrderByCreatedAtAsc();
        if (anyList.isPresent()) {
            ShoppingList list = anyList.get();
            list.setDefault(true);
            list.setArchived(false);
            return shoppingListRepository.save(list);
        }

        ShoppingList defaultList = new ShoppingList("Main Shopping List", "#0b292f", "shopping-bag", true);
        return shoppingListRepository.save(defaultList);
    }

    // =========================================================================
    // Item Operations (List-Scoped & Global)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ShoppingListItemResponse> listItems(
            Long listId,
            String search,
            Category category,
            ShoppingItemPriority priority,
            Boolean purchased,
            String sortBy,
            String sortDir
    ) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        boolean descending = "desc".equalsIgnoreCase(sortDir);

        Comparator<ShoppingListItem> comparator = buildComparator(sortBy, descending);

        List<ShoppingListItem> items;
        if (listId != null) {
            findShoppingListByIdOrThrow(listId); // verify list exists
            items = shoppingRepository.findByShoppingListId(listId);
        } else {
            items = shoppingRepository.findAll();
        }

        return items.stream()
                .filter(item -> normalizedSearch.isEmpty()
                        || item.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .filter(item -> category == null || item.getCategory() == category)
                .filter(item -> priority == null || item.getPriority() == priority)
                .filter(item -> purchased == null || item.isPurchased() == purchased)
                .sorted(comparator)
                .map(ShoppingListItemResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShoppingListItemResponse> listItems(
            String search,
            Category category,
            ShoppingItemPriority priority,
            Boolean purchased,
            String sortBy,
            String sortDir
    ) {
        return listItems(null, search, category, priority, purchased, sortBy, sortDir);
    }

    @Transactional(readOnly = true)
    public ShoppingListItemResponse getItem(Long id) {
        ShoppingListItem item = findByIdOrThrow(id);
        return ShoppingListItemResponse.fromEntity(item);
    }

    @Transactional(readOnly = true)
    public ShoppingListItemResponse getItemInList(Long listId, Long itemId) {
        ShoppingListItem item = findByIdOrThrow(itemId);
        if (!item.getShoppingList().getId().equals(listId)) {
            throw new ResourceNotFoundException("Item " + itemId + " does not belong to list " + listId);
        }
        return ShoppingListItemResponse.fromEntity(item);
    }

    public ShoppingListItemResponse createItem(ShoppingListItemRequest request) {
        validateRequest(request);
        ShoppingList targetList = resolveTargetList(request.getShoppingListId());

        ShoppingListItem item = new ShoppingListItem();
        applyRequestToEntity(request, item);
        item.setShoppingList(targetList);

        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public ShoppingListItemResponse createItemInList(Long listId, ShoppingListItemRequest request) {
        validateRequest(request);
        ShoppingList targetList = findShoppingListByIdOrThrow(listId);

        ShoppingListItem item = new ShoppingListItem();
        applyRequestToEntity(request, item);
        item.setShoppingList(targetList);

        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public ShoppingListItemResponse updateItem(Long id, ShoppingListItemRequest request) {
        validateRequest(request);
        ShoppingListItem item = findByIdOrThrow(id);
        applyRequestToEntity(request, item);

        if (request.getShoppingListId() != null && !request.getShoppingListId().equals(item.getShoppingList().getId())) {
            ShoppingList newList = findShoppingListByIdOrThrow(request.getShoppingListId());
            item.setShoppingList(newList);
        }

        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public ShoppingListItemResponse updateItemInList(Long listId, Long itemId, ShoppingListItemRequest request) {
        validateRequest(request);
        ShoppingListItem item = findByIdOrThrow(itemId);
        if (!item.getShoppingList().getId().equals(listId)) {
            throw new ResourceNotFoundException("Item " + itemId + " does not belong to list " + listId);
        }
        applyRequestToEntity(request, item);

        if (request.getShoppingListId() != null && !request.getShoppingListId().equals(listId)) {
            ShoppingList newList = findShoppingListByIdOrThrow(request.getShoppingListId());
            item.setShoppingList(newList);
        }

        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public ShoppingListItemResponse togglePurchased(Long id, Boolean purchased) {
        ShoppingListItem item = findByIdOrThrow(id);
        if (purchased != null) {
            item.setPurchased(purchased);
        } else {
            item.setPurchased(!item.isPurchased());
        }
        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public void deleteItem(Long id) {
        ShoppingListItem item = findByIdOrThrow(id);
        shoppingRepository.delete(item);
    }

    public void deleteItemInList(Long listId, Long itemId) {
        ShoppingListItem item = findByIdOrThrow(itemId);
        if (!item.getShoppingList().getId().equals(listId)) {
            throw new ResourceNotFoundException("Item " + itemId + " does not belong to list " + listId);
        }
        shoppingRepository.delete(item);
    }

    public long clearPurchased(Long listId) {
        List<ShoppingListItem> purchasedItems = listId != null
                ? shoppingRepository.findByShoppingListIdAndPurchased(listId, true)
                : shoppingRepository.findByPurchased(true);

        long count = purchasedItems.size();
        shoppingRepository.deleteAll(purchasedItems);
        return count;
    }

    public long clearPurchased() {
        return clearPurchased(null);
    }

    public ShoppingListItemResponse addFromInventory(Long inventoryItemId, AddFromInventoryRequest request) {
        GroceryItem grocery = groceryRepository.findById(inventoryItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Grocery item not found with id: " + inventoryItemId));

        double qtyToBuy = request != null && request.getQuantityToBuy() != null
                ? roundQuantity(request.getQuantityToBuy())
                : 1.0;

        if (qtyToBuy <= 0) {
            throw new InvalidInventoryOperationException("Quantity to buy must be greater than zero");
        }

        ShoppingItemPriority priority = request != null && request.getPriority() != null
                ? request.getPriority()
                : ShoppingItemPriority.MEDIUM;

        ShoppingList targetList = resolveTargetList(request != null ? request.getShoppingListId() : null);

        // Check if an existing unchecked item in THIS list is linked to this grocery item or shares the exact name
        Optional<ShoppingListItem> existingUnchecked = shoppingRepository.findByShoppingListId(targetList.getId()).stream()
                .filter(item -> !item.isPurchased())
                .filter(item -> (item.getInventoryItemId() != null && item.getInventoryItemId().equals(inventoryItemId))
                        || item.getName().equalsIgnoreCase(grocery.getProductName().trim()))
                .findFirst();

        ShoppingListItem item;
        if (existingUnchecked.isPresent()) {
            item = existingUnchecked.get();
            item.setQuantity(roundQuantity(item.getQuantity() + qtyToBuy));
            if (priority.ordinal() > item.getPriority().ordinal()) {
                item.setPriority(priority);
            }
        } else {
            item = new ShoppingListItem();
            item.setName(grocery.getProductName().trim());
            item.setCategory(grocery.getCategory());
            item.setQuantity(qtyToBuy);
            item.setUnit(grocery.getUnit());
            item.setEstimatedPrice(grocery.getPrice());
            item.setPurchased(false);
            item.setPriority(priority);
            item.setInventoryItemId(grocery.getId());
            item.setNotes(grocery.getNotes());
            item.setShoppingList(targetList);
        }

        ShoppingListItem saved = shoppingRepository.save(item);
        return ShoppingListItemResponse.fromEntity(saved);
    }

    public GroceryItemResponse convertPurchasedToInventory(
            Long shoppingListItemId,
            ConvertPurchasedToInventoryRequest request
    ) {
        ShoppingListItem shoppingItem = findByIdOrThrow(shoppingListItemId);
        if (!shoppingItem.isPurchased()) {
            throw new InvalidInventoryOperationException(
                    "Cannot add unpurchased shopping list item to inventory. Mark it as purchased first."
            );
        }

        GroceryItem groceryToSave;

        // 1. If linked to an existing grocery item that is still in the database, restock it
        if (shoppingItem.getInventoryItemId() != null) {
            Optional<GroceryItem> linkedGrocery = groceryRepository.findById(shoppingItem.getInventoryItemId());
            if (linkedGrocery.isPresent()) {
                groceryToSave = linkedGrocery.get();
                groceryToSave.setQuantity(roundQuantity(groceryToSave.getQuantity() + shoppingItem.getQuantity()));
                if (request != null && request.getExpiryDate() != null) {
                    groceryToSave.setExpiryDate(request.getExpiryDate());
                    groceryToSave.setExpirySource(request.getExpirySource() != null
                            ? request.getExpirySource()
                            : ExpirySource.ESTIMATED);
                }
                if (request != null && request.getStorageLocation() != null) {
                    groceryToSave.setStorageLocation(request.getStorageLocation());
                }
                if (shoppingItem.getEstimatedPrice() != null) {
                    groceryToSave.setPrice(shoppingItem.getEstimatedPrice());
                }
            } else {
                groceryToSave = createNewGroceryFromShoppingItem(shoppingItem, request);
            }
        } else {
            // Check by exact name to prevent creating duplicates if an item with the same name already exists
            Optional<GroceryItem> sameNameItem = groceryRepository.findAll().stream()
                    .filter(g -> g.getProductName().equalsIgnoreCase(shoppingItem.getName().trim()))
                    .findFirst();

            if (sameNameItem.isPresent()) {
                groceryToSave = sameNameItem.get();
                groceryToSave.setQuantity(roundQuantity(groceryToSave.getQuantity() + shoppingItem.getQuantity()));
                if (request != null && request.getExpiryDate() != null) {
                    groceryToSave.setExpiryDate(request.getExpiryDate());
                    groceryToSave.setExpirySource(request.getExpirySource() != null
                            ? request.getExpirySource()
                            : ExpirySource.ESTIMATED);
                }
                if (request != null && request.getStorageLocation() != null) {
                    groceryToSave.setStorageLocation(request.getStorageLocation());
                }
                if (shoppingItem.getEstimatedPrice() != null) {
                    groceryToSave.setPrice(shoppingItem.getEstimatedPrice());
                }
            } else {
                groceryToSave = createNewGroceryFromShoppingItem(shoppingItem, request);
            }
        }

        GroceryItem saved = groceryRepository.save(groceryToSave);

        if (request != null && request.isRemoveFromShoppingList()) {
            shoppingRepository.delete(shoppingItem);
        }

        return GroceryItemResponse.fromEntity(saved, expiryStatusService);
    }

    @Transactional(readOnly = true)
    public ShoppingBudgetSummary getBudgetSummary(Long listId) {
        List<ShoppingListItem> all = listId != null
                ? shoppingRepository.findByShoppingListId(listId)
                : shoppingRepository.findAll();

        BigDecimal uncheckedTotal = BigDecimal.ZERO;
        long uncheckedWithPrice = 0;
        long uncheckedWithoutPrice = 0;
        long totalUnchecked = 0;

        BigDecimal checkedTotal = BigDecimal.ZERO;
        long checkedWithPrice = 0;
        long checkedWithoutPrice = 0;
        long totalChecked = 0;

        for (ShoppingListItem item : all) {
            BigDecimal price = item.getEstimatedPrice();
            double qty = item.getQuantity() != null ? item.getQuantity() : 1.0;

            if (!item.isPurchased()) {
                totalUnchecked++;
                if (price != null && price.compareTo(BigDecimal.ZERO) >= 0) {
                    uncheckedWithPrice++;
                    uncheckedTotal = uncheckedTotal.add(price.multiply(BigDecimal.valueOf(qty)));
                } else {
                    uncheckedWithoutPrice++;
                }
            } else {
                totalChecked++;
                if (price != null && price.compareTo(BigDecimal.ZERO) >= 0) {
                    checkedWithPrice++;
                    checkedTotal = checkedTotal.add(price.multiply(BigDecimal.valueOf(qty)));
                } else {
                    checkedWithoutPrice++;
                }
            }
        }

        return new ShoppingBudgetSummary(
                uncheckedTotal.setScale(2, RoundingMode.HALF_UP),
                uncheckedWithPrice,
                uncheckedWithoutPrice,
                checkedTotal.setScale(2, RoundingMode.HALF_UP),
                checkedWithPrice,
                checkedWithoutPrice,
                totalUnchecked,
                totalChecked
        );
    }

    @Transactional(readOnly = true)
    public ShoppingBudgetSummary getBudgetSummary() {
        return getBudgetSummary(null);
    }

    @Transactional(readOnly = true)
    public List<LowStockSuggestion> getLowStockSuggestions() {
        List<GroceryItem> lowStockGroceries = groceryRepository.findAll().stream()
                .filter(item -> item.getQuantity() <= item.getMinimumStockThreshold())
                .toList();

        Set<String> shoppingItemNames = new HashSet<>();
        Set<Long> shoppingLinkedGroceryIds = new HashSet<>();
        for (ShoppingListItem item : shoppingRepository.findAll()) {
            if (!item.isPurchased()) {
                shoppingItemNames.add(item.getName().trim().toLowerCase(Locale.ROOT));
                if (item.getInventoryItemId() != null) {
                    shoppingLinkedGroceryIds.add(item.getInventoryItemId());
                }
            }
        }

        return lowStockGroceries.stream()
                .map(item -> {
                    boolean alreadyInList = shoppingLinkedGroceryIds.contains(item.getId())
                            || shoppingItemNames.contains(item.getProductName().trim().toLowerCase(Locale.ROOT));

                    double deficit = item.getMinimumStockThreshold() - item.getQuantity();
                    double suggestedQty = deficit > 0 ? roundQuantity(deficit) : 1.0;

                    return new LowStockSuggestion(
                            item.getId(),
                            item.getProductName(),
                            item.getCategory(),
                            item.getQuantity(),
                            item.getMinimumStockThreshold(),
                            suggestedQty,
                            item.getUnit(),
                            item.getPrice(),
                            alreadyInList
                    );
                })
                .toList();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private ShoppingList findShoppingListByIdOrThrow(Long id) {
        return shoppingListRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping list not found with id: " + id));
    }

    private ShoppingListItem findByIdOrThrow(Long id) {
        return shoppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping list item not found with id: " + id));
    }

    private ShoppingList resolveTargetList(Long listId) {
        if (listId != null) {
            return findShoppingListByIdOrThrow(listId);
        }
        return getOrCreateDefaultList();
    }

    private void validateListRequest(ShoppingListRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isBlank()) {
            throw new InvalidInventoryOperationException("List title is required");
        }
        if (request.getTitle().trim().length() > 120) {
            throw new InvalidInventoryOperationException("List title cannot exceed 120 characters");
        }
    }

    private void validateRequest(ShoppingListItemRequest request) {
        if (request.getQuantity() != null && request.getQuantity() <= 0) {
            throw new InvalidInventoryOperationException("Quantity must be greater than zero");
        }
        if (request.getEstimatedPrice() != null && request.getEstimatedPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidInventoryOperationException("Estimated price cannot be negative");
        }
    }

    private void applyRequestToEntity(ShoppingListItemRequest request, ShoppingListItem item) {
        item.setName(request.getName().trim());
        item.setCategory(request.getCategory());
        item.setQuantity(roundQuantity(request.getQuantity()));
        item.setUnit(request.getUnit().trim());
        item.setEstimatedPrice(request.getEstimatedPrice());
        if (request.getPurchased() != null) {
            item.setPurchased(request.getPurchased());
        }
        if (request.getPriority() != null) {
            item.setPriority(request.getPriority());
        }
        item.setNotes(request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes().trim()
                : null);
        item.setInventoryItemId(request.getInventoryItemId());
    }

    private GroceryItem createNewGroceryFromShoppingItem(
            ShoppingListItem shoppingItem,
            ConvertPurchasedToInventoryRequest request
    ) {
        GroceryItem grocery = new GroceryItem();
        grocery.setProductName(shoppingItem.getName().trim());
        grocery.setCategory(shoppingItem.getCategory());
        grocery.setQuantity(roundQuantity(shoppingItem.getQuantity()));
        grocery.setUnit(shoppingItem.getUnit());

        StorageLocation location = request != null && request.getStorageLocation() != null
                ? request.getStorageLocation()
                : StorageLocation.PANTRY;
        grocery.setStorageLocation(location);

        double minStock = request != null && request.getMinimumStockThreshold() != null
                ? request.getMinimumStockThreshold()
                : 1.0;
        grocery.setMinimumStockThreshold(minStock);

        if (request != null && request.getPurchaseDate() != null) {
            grocery.setPurchaseDate(request.getPurchaseDate());
        } else {
            grocery.setPurchaseDate(java.time.LocalDate.now());
        }

        if (request != null && request.getExpiryDate() != null) {
            grocery.setExpiryDate(request.getExpiryDate());
            grocery.setExpirySource(request.getExpirySource() != null
                    ? request.getExpirySource()
                    : ExpirySource.ESTIMATED);
        }

        if (shoppingItem.getEstimatedPrice() != null) {
            grocery.setPrice(shoppingItem.getEstimatedPrice());
        }

        String notes = request != null && request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes().trim()
                : shoppingItem.getNotes();
        grocery.setNotes(notes);

        return grocery;
    }

    private Comparator<ShoppingListItem> buildComparator(String sortBy, boolean descending) {
        Comparator<ShoppingListItem> comparator;
        if ("priority".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparing(ShoppingListItem::getPriority, (p1, p2) -> {
                int rank1 = priorityRank(p1);
                int rank2 = priorityRank(p2);
                return Integer.compare(rank2, rank1);
            }).thenComparing(item -> item.getName().toLowerCase(Locale.ROOT));
        } else if ("category".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparing((ShoppingListItem item) -> item.getCategory().name())
                    .thenComparing(item -> item.getName().toLowerCase(Locale.ROOT));
        } else {
            comparator = Comparator.comparing((ShoppingListItem item) -> item.getName().toLowerCase(Locale.ROOT));
        }
        return descending ? comparator.reversed() : comparator;
    }

    private int priorityRank(ShoppingItemPriority priority) {
        if (priority == null) return 1;
        return switch (priority) {
            case URGENT -> 4;
            case HIGH -> 3;
            case MEDIUM -> 2;
            case LOW -> 1;
        };
    }

    private double roundQuantity(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
