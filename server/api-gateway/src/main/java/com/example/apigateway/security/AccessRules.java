package com.example.apigateway.security;

import org.springframework.http.HttpMethod;
import org.springframework.http.server.PathContainer;
import org.springframework.stereotype.Component;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.List;

/**
 * Route-level authorization rules enforced by {@link JwtAuthenticationFilter}.
 *
 * <p>Every {@code /api/**} endpoint requires a valid token except the public ones listed here;
 * the endpoints in {@link #managerOnly} additionally require the {@code Manager} role.
 * Patterns are matched against the decoded path, ignoring a trailing slash.
 */
@Component
public class AccessRules {

    public static final String MANAGER = "Manager";

    private static final PathPatternParser PARSER = new PathPatternParser();

    private final List<Rule> publicEndpoints = List.of(
            rule(HttpMethod.POST, "/api/users/login"));

    private final List<Rule> managerOnly = List.of(
            // account management
            rule(HttpMethod.GET, "/api/users"),
            rule(HttpMethod.GET, "/api/users/{username}"),
            rule(HttpMethod.POST, "/api/users"),
            rule(HttpMethod.PUT, "/api/users/**"),
            rule(HttpMethod.DELETE, "/api/users/**"),
            rule(HttpMethod.GET, "/api/employees"),
            rule(HttpMethod.POST, "/api/employees"),
            rule(HttpMethod.DELETE, "/api/employees/**"),
            rule(HttpMethod.PUT, "/api/employees/update-checkin-checkout"),
            // request approval
            rule(HttpMethod.GET, "/api/requests"),
            rule(HttpMethod.GET, "/api/requests/not-approved"),
            rule(HttpMethod.GET, "/api/requests/approved"),
            rule(HttpMethod.PUT, "/api/requests/{id}/approve"),
            rule(HttpMethod.PUT, "/api/requests/{id}/reject"),
            // rewards
            rule(HttpMethod.GET, "/api/points"),
            rule(HttpMethod.POST, "/api/points/send"),
            rule(null, "/api/activities/**"),
            rule(HttpMethod.POST, "/api/vouchery/campaigns/{id}/vouchers/batch"));

    public boolean isPublic(HttpMethod method, PathContainer path) {
        PathContainer normalized = normalize(path);
        return publicEndpoints.stream().anyMatch(rule -> rule.matches(method, normalized));
    }

    public boolean isAllowed(HttpMethod method, PathContainer path, String role) {
        if (MANAGER.equals(role)) {
            return true;
        }
        PathContainer normalized = normalize(path);
        return managerOnly.stream().noneMatch(rule -> rule.matches(method, normalized));
    }

    /** Treats {@code /api/users/} like {@code /api/users} so a trailing slash cannot bypass a rule. */
    private static PathContainer normalize(PathContainer path) {
        String value = path.value();
        if (value.length() > 1 && value.endsWith("/")) {
            return PathContainer.parsePath(value.substring(0, value.length() - 1));
        }
        return path;
    }

    private static Rule rule(HttpMethod method, String pattern) {
        return new Rule(method, PARSER.parse(pattern));
    }

    /** {@code method == null} matches any HTTP method. */
    private record Rule(HttpMethod method, PathPattern pattern) {
        boolean matches(HttpMethod requestMethod, PathContainer path) {
            return (method == null || method.equals(requestMethod)) && pattern.matches(path);
        }
    }
}
