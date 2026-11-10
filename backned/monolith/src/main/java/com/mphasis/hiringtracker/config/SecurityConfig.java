package com.mphasis.hiringtracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Provides a {@link PasswordEncoder} (BCrypt) bean for the entire monolith.
 *
 * <p>Uses {@code spring-security-crypto} only — not the full Spring Security
 * starter — so there is no security filter chain auto-configuration. This keeps
 * the change non-breaking for the deployed app while giving every service a
 * single, consistent password-hashing implementation.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
