package com.smartfridge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "grocery_items")
public class GroceryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name", nullable = false, length = 120)
    private String productName;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 40)
    private Category category;

    @Column(name = "quantity", nullable = false)
    private Double quantity;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_location", nullable = false, length = 40)
    private StorageLocation storageLocation;

    @Column(name = "minimum_stock_threshold", nullable = false)
    private Double minimumStockThreshold;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "expiry_date", nullable = true)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "expiry_source", nullable = true, length = 20)
    private ExpirySource expirySource;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
