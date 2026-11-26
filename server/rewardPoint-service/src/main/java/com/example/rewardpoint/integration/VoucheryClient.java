package com.example.rewardpoint.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Registers employees as customers in the Vouchery voucher platform (optional integration). */
@Component
public class VoucheryClient {

    private static final Logger log = LoggerFactory.getLogger(VoucheryClient.class);

    private final RestClient restClient;
    private final String customersUrl;
    private final String apiKey;

    public VoucheryClient(RestClient.Builder restClientBuilder,
                          @Value("${vouchery.api.url}") String customersUrl,
                          @Value("${vouchery.api.key:}") String apiKey) {
        this.restClient = restClientBuilder.build();
        this.customersUrl = customersUrl;
        this.apiKey = apiKey;
    }

    public void createCustomer(Long userId) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("Vouchery API key not configured; skipping customer creation for user {}", userId);
            return;
        }
        try {
            restClient.post()
                    .uri(customersUrl)
                    .headers(headers -> headers.setBearerAuth(apiKey))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("identifier", userId.toString()))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Created Vouchery customer for user {}", userId);
        } catch (RestClientException e) {
            log.error("Could not create Vouchery customer for user {}", userId, e);
        }
    }
}
