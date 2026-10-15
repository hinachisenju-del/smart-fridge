package com.smartfridge.dto;

import com.smartfridge.entity.Category;
import com.smartfridge.entity.ExpirySource;
import com.smartfridge.entity.StorageLocation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public class GroceryItemRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 120, message = "Product name must be at most 120 characters")
    private String productName;

    @NotNull(message = "Category is required")
    private Category category;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Quantity cannot be negative")
    private Double quantity;

    @NotBlank(message = "Unit is required")
    @Size(max = 30, message = "Unit must be at most 30 characters")
    private String unit;

    @NotNull(message = "Storage location is required")
    private StorageLocation storageLocation;

    @NotNull(message = "Minimum stock threshold is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Minimum stock threshold cannot be negative")
    private Double minimumStockThreshold;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    private LocalDate expiryDate;

    private ExpirySource expirySource;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    private BigDecimal price;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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

    public StorageLocation getStorageLocation() {
        return storageLocation;
    }

    public void setStorageLocation(StorageLocation storageLocation) {
        this.storageLocation = storageLocation;
    }

    public Double getMinimumStockThreshold() {
        return minimumStockThreshold;
    }

    public void setMinimumStockThreshold(Double minimumStockThreshold) {
        this.minimumStockThreshold = minimumStockThreshold;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
