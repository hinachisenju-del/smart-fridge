package com.smartfridge.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shopping_lists")
public class ShoppingList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "color", nullable = false, length = 30)
    private String color = "#0b292f";

    @Column(name = "icon", nullable = false, length = 30)
    private String icon = "shopping-bag";

    @Column(name = "is_archived", nullable = false)
    private boolean isArchived = false;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "shoppingList", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = false)
    private List<ShoppingListItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.color == null || this.color.isBlank()) {
            this.color = "#0b292f";
        }
        if (this.icon == null || this.icon.isBlank()) {
            this.icon = "shopping-bag";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public ShoppingList() {
    }

    public ShoppingList(String title, String color, String icon, boolean isDefault) {
        this.title = title;
        this.color = color != null ? color : "#0b292f";
        this.icon = icon != null ? icon : "shopping-bag";
        this.isDefault = isDefault;
        this.isArchived = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public boolean isArchived() {
        return isArchived;
    }

    public void setArchived(boolean archived) {
        isArchived = archived;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
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

    public List<ShoppingListItem> getItems() {
        return items;
    }

    public void setItems(List<ShoppingListItem> items) {
        this.items = items;
    }

    public void addItem(ShoppingListItem item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.add(item);
        item.setShoppingList(this);
    }
}
