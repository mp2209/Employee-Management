package com.example.userservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-definitely-at-least-32-bytes";

    @Test
    void issuesSignedTokenWithIdentityClaimsAndConfiguredExpiry() {
        String token = new JwtService(SECRET, 2).generateToken(42L, "alice", "Manager");

        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo("alice");
        assertThat(claims.get(JwtService.CLAIM_USER_ID, Long.class)).isEqualTo(42L);
        assertThat(claims.get(JwtService.CLAIM_ROLE, String.class)).isEqualTo("Manager");
        assertThat(Duration.between(claims.getIssuedAt().toInstant(), claims.getExpiration().toInstant()))
                .isEqualTo(Duration.ofHours(2));
    }

    @Test
    void refusesSecretsShorterThan256Bits() {
        assertThatThrownBy(() -> new JwtService("short-secret", 24))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
