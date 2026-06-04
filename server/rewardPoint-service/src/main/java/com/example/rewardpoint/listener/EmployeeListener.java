package com.example.rewardpoint.listener;

import com.example.rewardpoint.service.PointService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import java.util.HashMap;
import java.util.Map;

@Component
public class EmployeeListener {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeListener.class);

    private final PointService pointService;
    private final String voucheryApiUrl;
    private final String voucheryApiKey;

    public EmployeeListener(PointService pointService,
                            @Value("${vouchery.api.url}") String voucheryApiUrl,
                            @Value("${vouchery.api.key}") String voucheryApiKey) {
        this.pointService = pointService;
        this.voucheryApiUrl = voucheryApiUrl;
        this.voucheryApiKey = voucheryApiKey;
    }

    @RabbitListener(queues = "employeeQueue")
    public void handleEmployeeMessage(byte[] uidMessage) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(uidMessage);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            Long uid = (Long) ois.readObject();
            logger.info("Received employee UID: {}", uid);
            pointService.createPointRecord(uid);
            createVoucherProfile(uid);
        } catch (Exception e) {
            logger.error("Error processing employee message", e);
        }
    }

    public void createVoucherProfile(Long uid) {
        if (voucheryApiKey == null || voucheryApiKey.isBlank()) {
            logger.warn("Vouchery API key not configured; skipping profile creation for UID {}", uid);
            return;
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(voucheryApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> bodyParams = new HashMap<>();
        bodyParams.put("identifier", uid.toString());

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(bodyParams, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    voucheryApiUrl, HttpMethod.POST, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully created voucher profile for UID: {}", uid);
            } else {
                logger.error("Failed to create voucher profile for UID: {}. Status: {}",
                        uid, response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error creating voucher profile for UID: {}", uid, e);
        }
    }
}