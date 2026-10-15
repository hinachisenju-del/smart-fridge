package com.smartfridge.dto;

import jakarta.validation.constraints.NotNull;

public class QuantityAdjustmentRequest {

    @NotNull(message = "Action type is required (USE, FINISH, RESTOCK, CORRECT)")
    private QuantityActionType action;

    private Double amount;

    public QuantityActionType getAction() {
        return action;
    }

    public void setAction(QuantityActionType action) {
        this.action = action;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
