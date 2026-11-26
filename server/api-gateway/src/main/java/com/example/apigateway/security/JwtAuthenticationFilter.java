package com.example.apigateway.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.PathContainer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Authenticates every {@code /api/**} request at the edge.
 *
 * <ol>
 *   <li>Removes any identity headers sent by the client, so they cannot be spoofed.</li>
 *   <li>Lets CORS preflights, non-API paths and public endpoints (login) through.</li>
 *   <li>Verifies the HS256 bearer token (signature and expiry) issued by user-service.</li>
 *   <li>Applies the role rules from {@link AccessRules}.</li>
 *   <li>Forwards the caller's id and role to the downstream service as headers.</li>
 * </ol>
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String USER_ROLE_HEADER = "X-User-Role";

    private static final PathPattern API_PATHS = new PathPatternParser().parse("/api/**");
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtParser jwtParser;
    private final AccessRules accessRules;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret,
                                   AccessRules accessRules,
                                   ObjectMapper objectMapper) {
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes (256 bits) for HS256");
        }
        this.jwtParser = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(key)).build();
        this.accessRules = accessRules;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerHttpRequest.Builder forwarded = request.mutate()
                .headers(headers -> {
                    headers.remove(USER_ID_HEADER);
                    headers.remove(USER_ROLE_HEADER);
                });

        HttpMethod method = request.getMethod();
        PathContainer path = request.getPath().pathWithinApplication();
        if (HttpMethod.OPTIONS.equals(method) || !API_PATHS.matches(path) || accessRules.isPublic(method, path)) {
            return chain.filter(exchange.mutate().request(forwarded.build()).build());
        }
        if (path.value().contains("//")) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "Malformed path");
        }

        String authorization = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        Claims claims;
        try {
            claims = jwtParser.parseSignedClaims(authorization.substring(BEARER_PREFIX.length()).trim()).getPayload();
        } catch (ExpiredJwtException e) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Token has expired");
        } catch (JwtException | IllegalArgumentException e) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        Object userId = claims.get("uid");
        String role = claims.get("role", String.class);
        if (userId == null || role == null) {
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Invalid token");
        }
        if (!accessRules.isAllowed(method, path, role)) {
            return reject(exchange, HttpStatus.FORBIDDEN, "This action requires the Manager role");
        }

        forwarded.header(USER_ID_HEADER, userId.toString())
                .header(USER_ROLE_HEADER, role);
        return chain.filter(exchange.mutate().request(forwarded.build()).build());
    }

    /** Runs before the routing and load-balancing filters. */
    @Override
    public int getOrder() {
        return -100;
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        if (status == HttpStatus.UNAUTHORIZED) {
            response.getHeaders().set(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.name().toLowerCase(Locale.ROOT));
        body.put("message", message);
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            bytes = new byte[0];
        }
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }
}
