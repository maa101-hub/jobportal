package com.mphasis.hiringtracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT configuration bound from application properties.
 *
 * <p>Properties (all optional — sensible defaults for local dev):
 * <ul>
 *   <li>{@code jwt.secret} — HMAC-SHA256 signing key (min 32 chars in prod)</li>
 *   <li>{@code jwt.expiration-ms} — token lifetime in milliseconds</li>
 * </ul>
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret = "hiretrack-default-secret-change-me-in-production-min-32-chars!!";
    private long expirationMs = 86400000L; // 24 hours

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }
}
