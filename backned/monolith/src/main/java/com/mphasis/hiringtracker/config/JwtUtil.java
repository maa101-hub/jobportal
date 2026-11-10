package com.mphasis.hiringtracker.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Stateless JWT utility for issuing and parsing tokens.
 *
 * <p>Tokens are signed with HMAC-SHA256 and carry the user id, role, and
 * company id as custom claims. The frontend stores the token and sends it
 * as a {@code Bearer} token in the {@code Authorization} header.
 */
@Component
public class JwtUtil {

    private final JwtProperties properties;
    private SecretKey signingKey;

    public JwtUtil(JwtProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        // The HMAC-SHA256 key must be at least 256 bits (32 bytes).
        byte[] keyBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // Pad to meet the minimum — in production the secret should be set
            // to a proper 256-bit (or longer) random string.
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Issues a signed JWT for the given user.
     *
     * @param userId    the user's database id
     * @param role      the user's role string (USER/ADMIN/DELIVERY/TFG/TAG)
     * @param companyId the company id (null for candidates)
     * @param email     the user's email (subject)
     * @return the compact JWT string
     */
    public String generateToken(Long userId, String role, Long companyId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.getExpirationMs());

        var builder = Jwts.builder()
                .subject(String.valueOf(email))
                .issuedAt(now)
                .expiration(expiry)
                .claim("userId", userId)
                .claim("role", role);

        if (companyId != null) {
            builder.claim("companyId", companyId);
        }

        return builder.signWith(signingKey).compact();
    }

    /**
     * Parses and validates a JWT, returning the claims.
     *
     * @param token the compact JWT
     * @return the claims, or {@code null} if the token is invalid/expired
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    /** Extracts the user id claim, or null. */
    public Long getUserId(Claims claims) {
        Object val = claims.get("userId");
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    /** Extracts the role claim, or null. */
    public String getRole(Claims claims) {
        Object val = claims.get("role");
        return val != null ? String.valueOf(val) : null;
    }

    /** Extracts the companyId claim, or null. */
    public Long getCompanyId(Claims claims) {
        Object val = claims.get("companyId");
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
