package com.example.rewardpoint.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Identity of the authenticated caller, forwarded by the api-gateway after it verified the JWT.
 *
 * <p>The gateway removes these headers from incoming client requests and sets them itself, so
 * they cannot be spoofed as long as the service is only reachable through the gateway (as in
 * the Docker Compose setup). When the headers are absent (a direct call while debugging a single
 * service locally) the checks are skipped.
 */
public final class CallerIdentity {

    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String ROLE_HEADER = "X-User-Role";
    public static final String MANAGER = "Manager";

    private CallerIdentity() {
    }

    /** The caller must own the resource or be a manager. */
    public static void requireSelfOrManager(Long callerId, String callerRole, Long ownerId) {
        if (callerId == null || MANAGER.equals(callerRole) || callerId.equals(ownerId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own data");
    }

    /** The caller must be acting on their own account. */
    public static void requireSelf(Long callerId, Long ownerId) {
        if (callerId == null || callerId.equals(ownerId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only act on your own account");
    }
}
