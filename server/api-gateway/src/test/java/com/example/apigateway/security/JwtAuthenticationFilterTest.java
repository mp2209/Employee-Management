package com.example.apigateway.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtAuthenticationFilterTest {

    private static final String SECRET = "test-secret-that-is-definitely-at-least-32-bytes";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private final JwtAuthenticationFilter filter =
            new JwtAuthenticationFilter(SECRET, new AccessRules(), new ObjectMapper());

    /** Records the exchange that reached the next filter, i.e. what would be routed downstream. */
    private final AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
    private final GatewayFilterChain chain = exchange -> {
        forwarded.set(exchange);
        return Mono.empty();
    };

    @Test
    void loginIsPublic() {
        MockServerWebExchange exchange = run(MockServerHttpRequest.post("/api/users/login"));

        assertThat(forwarded.get()).isNotNull();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void nonApiPathsAndCorsPreflightsAreNotAuthenticated() {
        run(MockServerHttpRequest.get("/actuator/health"));
        assertThat(forwarded.get()).isNotNull();

        forwarded.set(null);
        run(MockServerHttpRequest.options("/api/points/1"));
        assertThat(forwarded.get()).isNotNull();
    }

    @Test
    void rejectsRequestWithoutToken() {
        MockServerWebExchange exchange = run(MockServerHttpRequest.get("/api/points/1"));

        assertThat(forwarded.get()).isNull();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.WWW_AUTHENTICATE)).isEqualTo("Bearer");
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() {
        SecretKey otherKey = Keys.hmacShaKeyFor("another-secret-that-is-also-32-bytes-long!".getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder().subject("mallory").claim("uid", 7).claim("role", "Manager")
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(otherKey).compact();

        MockServerWebExchange exchange = run(withToken(MockServerHttpRequest.get("/api/points"), token));

        assertThat(forwarded.get()).isNull();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsExpiredToken() {
        String token = Jwts.builder().subject("alice").claim("uid", 2).claim("role", "Employee")
                .issuedAt(Date.from(Instant.now().minus(2, ChronoUnit.HOURS)))
                .expiration(Date.from(Instant.now().minus(1, ChronoUnit.HOURS)))
                .signWith(KEY).compact();

        MockServerWebExchange exchange = run(withToken(MockServerHttpRequest.get("/api/points/2"), token));

        assertThat(forwarded.get()).isNull();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void forwardsVerifiedIdentityAndDropsSpoofedHeaders() {
        MockServerHttpRequest.BaseBuilder<?> request = withToken(MockServerHttpRequest.get("/api/points/2"), token(2, "Employee"))
                .header(JwtAuthenticationFilter.USER_ID_HEADER, "1")
                .header(JwtAuthenticationFilter.USER_ROLE_HEADER, "Manager");

        run(request);

        HttpHeaders headers = forwarded.get().getRequest().getHeaders();
        assertThat(headers.get(JwtAuthenticationFilter.USER_ID_HEADER)).containsExactly("2");
        assertThat(headers.get(JwtAuthenticationFilter.USER_ROLE_HEADER)).containsExactly("Employee");
    }

    @Test
    void employeeCannotCallManagerEndpoints() {
        MockServerWebExchange exchange = run(withToken(MockServerHttpRequest.post("/api/points/send"), token(2, "Employee")));
        assertThat(forwarded.get()).isNull();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // A trailing slash must not bypass the rule.
        exchange = run(withToken(MockServerHttpRequest.post("/api/users/"), token(2, "Employee")));
        assertThat(forwarded.get()).isNull();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void managerCanCallManagerEndpoints() {
        run(withToken(MockServerHttpRequest.put("/api/requests/abc123/approve"), token(1, "Manager")));

        assertThat(forwarded.get()).isNotNull();
    }

    @Test
    void employeeCanCallEmployeeEndpoints() {
        run(withToken(MockServerHttpRequest.post("/api/points/redeem"), token(2, "Employee")));

        assertThat(forwarded.get()).isNotNull();
    }

    @Test
    void refusesWeakSecret() {
        assertThatThrownBy(() -> new JwtAuthenticationFilter("too-short", new AccessRules(), new ObjectMapper()))
                .isInstanceOf(IllegalStateException.class);
    }

    private MockServerWebExchange run(MockServerHttpRequest.BaseBuilder<?> request) {
        MockServerWebExchange exchange = MockServerWebExchange.from(request.build());
        filter.filter(exchange, chain).block();
        return exchange;
    }

    private static MockServerHttpRequest.BaseBuilder<?> withToken(MockServerHttpRequest.BaseBuilder<?> request, String token) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }

    private static String token(long userId, String role) {
        return Jwts.builder().subject("user" + userId).claim("uid", userId).claim("role", role)
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(KEY).compact();
    }
}
