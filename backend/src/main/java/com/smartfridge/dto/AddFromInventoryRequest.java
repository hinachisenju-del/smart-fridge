package com.smartfridge.dto;

import com.smartfridge.entity.ShoppingItemPriority;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class AddFromInventoryRequest {

    @NotNull(message = "Quantity to buy is required")
    @DecimalMin(value = "0.01", message = "Quantity to buy must be greater than zero")
    private Double quantityToBuy;

    private ShoppingItemPriority priority = ShoppingItemPriority.MEDIUM;

    private Long shoppingListId;

    public Double getQuantityToBuy() {
        return quantityToBuy;
    }

    public void setQuantityToBuy(Double quantityToBuy) {
        this.quantityToBuy = quantityToBuy;
    }

    public ShoppingItemPriority getPriority() {
        return priority;
    }

    public void setPriority(ShoppingItemPriority priority) {
        this.priority = priority;
    }

    public Long getShoppingListId() {
        return shoppingListId;
    }

    public void setShoppingListId(Long shoppingListId) {
        this.shoppingListId = shoppingListId;
    }
}
