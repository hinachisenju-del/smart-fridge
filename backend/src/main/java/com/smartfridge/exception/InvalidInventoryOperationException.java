package com.smartfridge.exception;

public class InvalidInventoryOperationException extends RuntimeException {
    public InvalidInventoryOperationException(String message) {
        super(message);
    }
}
