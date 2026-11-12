package com.mphasis.hiringtracker.config;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;

/** Reads the authenticated identity attached by {@link JwtAuthFilter}. */
public final class AuthContext {

    private AuthContext() {}

    public static Long userId(HttpServletRequest request) {
        Object value = request.getAttribute(JwtAuthFilter.AUTH_USER_ID);
        return value instanceof Number number ? number.longValue() : null;
    }

    public static Long requireUserId(HttpServletRequest request) {
        Long id = userId(request);
        if (id == null) throw new UnauthorizedException("Authentication required");
        return id;
    }

    public static Long requireCompanyId(HttpServletRequest request) {
        Object value = request.getAttribute(JwtAuthFilter.AUTH_COMPANY_ID);
        Long id = value instanceof Number number ? number.longValue() : null;
        if (id == null) throw new ForbiddenException("A company context is required");
        return id;
    }

    public static void requireRole(HttpServletRequest request, String... roles) {
        String role = String.valueOf(request.getAttribute(JwtAuthFilter.AUTH_ROLE));
        if (!Arrays.asList(roles).contains(role)) {
            throw new ForbiddenException("You are not allowed to perform this action");
        }
    }

    public static void requireCompany(HttpServletRequest request, Long companyId) {
        if (!requireCompanyId(request).equals(companyId)) {
            throw new ForbiddenException("You cannot access another company's data");
        }
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) { super(message); }
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) { super(message); }
    }
}
