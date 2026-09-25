package com.mphasis.hiringtracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Single, unified CORS policy for the whole monolith.
 *
 * <p>Replaces the two per-service CorsConfig classes. Uses explicit origin
 * patterns (not a plain wildcard) so that {@code allowCredentials(true)}
 * remains valid, which Spring forbids when the origin is exactly "*".
 *
 * <p>Allowed origins are configurable via the {@code CORS_ALLOWED_ORIGINS}
 * environment variable (comma-separated). This lets the deployed frontend
 * origin (e.g. the Vercel URL) be added without a code change. The local Vite
 * dev origins are always included.
 */
@Configuration
public class CorsConfig {

    /**
     * Comma-separated list of allowed frontend origins. Defaults to the
     * deployed Vercel domain plus its preview URLs. Override in production with
     * the CORS_ALLOWED_ORIGINS env var, e.g.
     * "https://jobportal-theta-one.vercel.app,https://*.vercel.app".
     */
    @Value("${CORS_ALLOWED_ORIGINS:https://jobportal-theta-one.vercel.app,https://*.vercel.app}")
    private String[] allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] origins = new String[allowedOrigins.length + 2];
                System.arraycopy(allowedOrigins, 0, origins, 0, allowedOrigins.length);
                origins[allowedOrigins.length] = "http://localhost:5173";
                origins[allowedOrigins.length + 1] = "http://127.0.0.1:5173";

                registry.addMapping("/**")
                        // allowedOriginPatterns supports wildcards (e.g. *.vercel.app)
                        // while still allowing credentials.
                        .allowedOriginPatterns(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
