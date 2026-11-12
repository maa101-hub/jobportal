package com.mphasis.hiringtracker.config;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtUtilTest {

    @Test
    void roundTripsIdentityClaims() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-at-least-32-characters-long");
        properties.setExpirationMs(60_000L);

        JwtUtil jwtUtil = new JwtUtil(properties);
        jwtUtil.init();

        String token = jwtUtil.generateToken(42L, "TAG", 7L, "tag@example.test");
        Claims claims = jwtUtil.parseToken(token);

        assertNotNull(claims);
        assertEquals(42L, jwtUtil.getUserId(claims));
        assertEquals("TAG", jwtUtil.getRole(claims));
        assertEquals(7L, jwtUtil.getCompanyId(claims));
        assertEquals("tag@example.test", claims.getSubject());
    }

    @Test
    void rejectsMalformedTokens() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-with-at-least-32-characters-long");
        JwtUtil jwtUtil = new JwtUtil(properties);
        jwtUtil.init();

        assertNull(jwtUtil.parseToken("not-a-jwt"));
    }
}
