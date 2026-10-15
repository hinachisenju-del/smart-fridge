package com.smartfridge.dto;

import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.StorageLocation;
import java.time.LocalDate;

public class ConvertPurchasedToInventoryRequest {

    private StorageLocation storageLocation;

    private LocalDate purchaseDate;

    private LocalDate expiryDate;

    private ExpirySource expirySource;

    private Double minimumStockThreshold;

    private String notes;

    private boolean removeFromShoppingList = false;

    public StorageLocation getStorageLocation() {
        return storageLocation;
    }

    public void setStorageLocation(StorageLocation storageLocation) {
        this.storageLocation = storageLocation;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public ExpirySource getExpirySource() {
        return expirySource;
    }

    public void setExpirySource(ExpirySource expirySource) {
        this.expirySource = expirySource;
    }

    public Double getMinimumStockThreshold() {
        return minimumStockThreshold;
    }

    public void setMinimumStockThreshold(Double minimumStockThreshold) {
        this.minimumStockThreshold = minimumStockThreshold;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isRemoveFromShoppingList() {
        return removeFromShoppingList;
    }

    public void setRemoveFromShoppingList(boolean removeFromShoppingList) {
        this.removeFromShoppingList = removeFromShoppingList;
    }
}
