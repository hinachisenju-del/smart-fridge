package com.smartfridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ShoppingListRequest {

    @NotBlank(message = "List title is required")
    @Size(max = 120, message = "List title cannot exceed 120 characters")
    private String title;

    @Size(max = 30, message = "Color code cannot exceed 30 characters")
    private String color;

    @Size(max = 30, message = "Icon identifier cannot exceed 30 characters")
    private String icon;

    public ShoppingListRequest() {
    }

    public ShoppingListRequest(String title, String color, String icon) {
        this.title = title;
        this.color = color;
        this.icon = icon;
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
}
