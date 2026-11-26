package com.example.rewardpoint.controller;

import com.example.rewardpoint.integration.StravaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Backs the manager-only Activities page (Strava club activities). */
@RestController
@RequestMapping("/api/activities/strava")
public class StravaController {

    private static final Logger log = LoggerFactory.getLogger(StravaController.class);

    private final StravaClient stravaClient;

    public StravaController(StravaClient stravaClient) {
        this.stravaClient = stravaClient;
    }

    @PostMapping("/token")
    public Map<String, Object> exchangeToken(@RequestBody Map<String, String> request) {
        if (!stravaClient.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Strava integration is not configured (set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET)");
        }
        String code = request.get("code");
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Authorization code is required");
        }
        try {
            Map<String, Object> token = stravaClient.exchangeCode(code);
            // Only what the browser needs: no refresh token, no athlete profile.
            return Map.of(
                    "access_token", token.get("access_token"),
                    "expires_in", token.get("expires_in"));
        } catch (RestClientResponseException e) {
            log.warn("Strava token exchange failed with status {}", e.getStatusCode());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Strava rejected the authorization code");
        }
    }
}
