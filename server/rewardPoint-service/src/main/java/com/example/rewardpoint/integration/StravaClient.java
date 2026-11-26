package com.example.rewardpoint.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

/** Server-side half of the Strava OAuth flow, so the client secret never reaches the browser. */
@Component
public class StravaClient {

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final String tokenUrl;

    public StravaClient(RestClient.Builder restClientBuilder,
                        @Value("${strava.client-id:}") String clientId,
                        @Value("${strava.client-secret:}") String clientSecret,
                        @Value("${strava.token-url:https://www.strava.com/oauth/token}") String tokenUrl) {
        this.restClient = restClientBuilder.build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenUrl = tokenUrl;
    }

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    /** Exchanges an OAuth authorization code for a short-lived access token. */
    public Map<String, Object> exchangeCode(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("code", code);
        form.add("grant_type", "authorization_code");

        return restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
    }
}
