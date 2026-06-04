package com.example.userservice.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Lightweight HS256 JWT signer/verifier.
 *
 * <p>This intentionally avoids pulling in the full {@code jjwt} library so the
 * service stays dependency-light. The token format is
 * {@code base64url(header) . base64url(payload) . base64url(HMAC-SHA256)}. It is
 * <strong>not</strong> intended for federated SSO; it is a self-contained
 * session token signed with a shared secret.
 */
@Component
public class JwtService {

    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    private final byte[] secret;

    public JwtService(@Value("${jwt.secret:change-me-in-production-please-use-32-bytes-minimum}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 16) {
            throw new IllegalStateException("jwt.secret must be at least 16 bytes");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(Long userId, String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", username);
        claims.put("uid", userId);
        claims.put("role", role);
        long issuedAt = System.currentTimeMillis() / 1000L;
        long expiresAt = issuedAt + 24 * 60 * 60; // 24h
        claims.put("iat", issuedAt);
        claims.put("exp", expiresAt);

        String header = b64Url(HEADER_JSON.getBytes(StandardCharsets.UTF_8));
        String payload = b64Url(toJson(claims).getBytes(StandardCharsets.UTF_8));
        String signingInput = header + "." + payload;
        String signature = b64Url(hmac(signingInput));
        return signingInput + "." + signature;
    }

    private byte[] hmac(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
    }

    private static String b64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String toJson(Map<String, Object> claims) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : claims.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(e.getKey()).append("\":");
            Object v = e.getValue();
            if (v instanceof Number) {
                sb.append(v);
            } else {
                sb.append('"').append(v).append('"');
            }
        }
        sb.append('}');
        return sb.toString();
    }
}
