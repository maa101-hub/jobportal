package com.mphasis.hiringtracker.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Monolith-wide exception handler that produces consistent, structured JSON
 * error responses across all service packages.
 *
 * <p>Every error response follows the shape:
 * <pre>
 * {
 *   "timestamp": "2026-10-17T...",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Email must be valid",
 *   "fieldErrors": { "email": "Email must be valid" }  // only for validation
 * }
 * </pre>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Bean Validation failure on a @RequestBody @Valid param. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        String message = fieldErrors.values().stream().findFirst().orElse("Validation failed");
        return buildResponse(HttpStatus.BAD_REQUEST, message, fieldErrors);
    }

    /** Bean Validation failure on a @RequestParam / @PathVariable (non-body). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> fieldErrors = ex.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        v -> v.getPropertyPath().toString(),
                        ConstraintViolation::getMessage,
                        (a, b) -> a));
        String message = fieldErrors.values().stream().findFirst().orElse("Constraint violation");
        return buildResponse(HttpStatus.BAD_REQUEST, message, fieldErrors);
    }

    /** Invalid enum value (e.g. Role.valueOf("BAD_ROLE")). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArg(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    /**
     * RuntimeException is used as a "not found" sentinel throughout the services
     * (e.g. {@code throw new RuntimeException("Job not found")}).
     * Maps to 404 if the message contains "not found", otherwise 400.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Unexpected error";
        boolean isNotFound = message.toLowerCase().contains("not found");
        HttpStatus status = isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        log.warn("Runtime exception ({}): {}", status.value(), message);
        return buildResponse(status, message, null);
    }

    /** Catch-all for unexpected errors — never expose stack traces to the client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message, Map<String, String> fieldErrors) {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            body.put("fieldErrors", fieldErrors);
        }
        return ResponseEntity.status(status).body(body);
    }
}
