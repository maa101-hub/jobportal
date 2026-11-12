package com.mphasis.hiringtracker.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import java.io.IOException;
import java.util.Set;

/**
 * Registers a JWT authentication filter that validates Bearer tokens on
 * incoming requests.
 *
 * <p>Public endpoints (login, signup, register, actuator) are allowed through
 * without a token. For all other paths, a valid Bearer token is required; the
 * extracted user id, role, and company id are stored as request attributes
 * ({@code AUTH_USER_ID}, {@code AUTH_ROLE}, {@code AUTH_COMPANY_ID}) for
 * downstream controllers to use.
 *
 * <p>This is a lightweight alternative to the full Spring Security filter
 * chain — it does not introduce auto-configuration or block the app on
 * startup. It uses the {@code jakarta.servlet} Filter API directly.
 */
@Configuration
public class JwtAuthFilter {

    /** Request attribute keys set by the filter for downstream use. */
    public static final String AUTH_USER_ID = "auth.userId";
    public static final String AUTH_ROLE = "auth.role";
    public static final String AUTH_COMPANY_ID = "auth.companyId";

    /** Paths that do not require authentication. */
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/users/login",
            "/users/signup",
            "/companies/login",
            "/companies/register",
            "/companies/employees/login"
    );

    /**
     * Comma-separated allowed CORS origins — same property as CorsConfig.
     * Used to add CORS headers to the 401 response so the browser doesn't
     * block the error from reaching the frontend.
     */
    @Value("${CORS_ALLOWED_ORIGINS:https://jobportal-theta-one.vercel.app,https://*.vercel.app}")
    private String[] allowedOrigins;

    @Bean
    public FilterRegistrationBean<jakarta.servlet.Filter> jwtFilterRegistration(JwtUtil jwtUtil) {
        FilterRegistrationBean<jakarta.servlet.Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter((request, response, chain) -> doFilter(
                (HttpServletRequest) request, (HttpServletResponse) response, chain, jwtUtil));
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        registration.setName("jwtAuthFilter");
        return registration;
    }

    private void doFilter(HttpServletRequest request,
                          HttpServletResponse response,
                          FilterChain chain,
                          JwtUtil jwtUtil) throws IOException, ServletException {

        String path = request.getRequestURI();

        // Allow public endpoints and actuator without a token.
        if (PUBLIC_PATHS.contains(path) || path.startsWith("/actuator")) {
            chain.doFilter(request, response);
            return;
        }

        // CORS preflight — let it through.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Claims claims = jwtUtil.parseToken(token);
            if (claims != null) {
                // Valid token — attach user context to the request.
                request.setAttribute(AUTH_USER_ID, jwtUtil.getUserId(claims));
                // Candidate records historically use USER in the database; expose
                // the product-level role expected by every protected controller.
                String role = jwtUtil.getRole(claims);
                request.setAttribute(AUTH_ROLE, "USER".equals(role) ? "CANDIDATE" : role);
                request.setAttribute(AUTH_COMPANY_ID, jwtUtil.getCompanyId(claims));
                chain.doFilter(request, response);
                return;
            }
        }

        // No valid token on a protected endpoint → 401.
        // Must add CORS headers here because the filter runs before Spring
        // MVC's CorsConfig handler — without them the browser blocks the
        // response and the frontend sees a generic "Network error" instead
        // of the actual 401 message.
        addCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("""
                {"success":false,"message":"Authentication required. Provide a valid Bearer token."}""");
    }

    /**
     * Adds {@code Access-Control-Allow-Origin} and related headers to the
     * response if the request's Origin matches an allowed pattern. Mirrors
     * the logic in {@link CorsConfig} so filter-level error responses are
     * visible to the browser.
     */
    private void addCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null) return;

        for (String allowed : allowedOrigins) {
            if (originMatches(origin, allowed)) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Vary", "Origin");
                return;
            }
        }
        // Also check the always-allowed local dev origins.
        if ("http://localhost:5173".equals(origin) || "http://127.0.0.1:5173".equals(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }
    }

    /** Simple wildcard match: "*.vercel.app" matches "https://anything.vercel.app". */
    private static boolean originMatches(String origin, String pattern) {
        if (pattern.equals(origin)) return true;
        if (pattern.startsWith("*.")) {
            String suffix = pattern.substring(1); // ".vercel.app"
            return origin.endsWith(suffix);
        }
        return false;
    }
}
