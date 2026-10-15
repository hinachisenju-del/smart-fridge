package com.smartfridge.dto;

import com.smartfridge.entity.Category;
import com.smartfridge.entity.ShoppingItemPriority;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ShoppingListItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(max = 120, message = "Item name cannot exceed 120 characters")
    private String name;

    @NotNull(message = "Category is required")
    private Category category;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than zero")
    private Double quantity;

    @NotBlank(message = "Unit is required")
    @Size(max = 30, message = "Unit cannot exceed 30 characters")
    private String unit;

    @DecimalMin(value = "0.0", inclusive = true, message = "Estimated price cannot be negative")
    private BigDecimal estimatedPrice;

    private Boolean purchased = false;

    private ShoppingItemPriority priority = ShoppingItemPriority.MEDIUM;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private Long inventoryItemId;

    private Long shoppingListId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public Boolean getPurchased() {
        return purchased;
    }

    public void setPurchased(Boolean purchased) {
        this.purchased = purchased;
    }

    public ShoppingItemPriority getPriority() {
        return priority;
    }

    public void setPriority(ShoppingItemPriority priority) {
        this.priority = priority;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public Long getShoppingListId() {
        return shoppingListId;
    }

    public void setShoppingListId(Long shoppingListId) {
        this.shoppingListId = shoppingListId;
    }
}
