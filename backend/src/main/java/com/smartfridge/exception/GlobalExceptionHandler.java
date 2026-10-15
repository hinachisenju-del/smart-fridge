package com.smartfridge.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(InvalidInventoryOperationException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOperation(InvalidInventoryOperationException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        String summaryMessage = fieldErrors.values().stream()
                .findFirst()
                .orElse("Validation failed for request payload");
        return buildResponse(HttpStatus.BAD_REQUEST, summaryMessage, fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadablePayload(HttpMessageNotReadableException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed request payload or invalid enum value", null);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status,
            String message,
            Map<String, String> fieldErrors
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            body.put("fieldErrors", fieldErrors);
        }
        return ResponseEntity.status(status).body(body);
    }
}
