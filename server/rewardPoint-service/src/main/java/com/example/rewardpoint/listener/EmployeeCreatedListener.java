package com.example.rewardpoint.listener;

import com.example.rewardpoint.config.RabbitMQConfig;
import com.example.rewardpoint.event.EmployeeCreatedEvent;
import com.example.rewardpoint.integration.VoucheryClient;
import com.example.rewardpoint.service.PointService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/** Opens a points wallet (and a Vouchery customer) for every newly created employee. */
@Component
public class EmployeeCreatedListener {

    private static final Logger log = LoggerFactory.getLogger(EmployeeCreatedListener.class);

    private final PointService pointService;
    private final VoucheryClient voucheryClient;

    public EmployeeCreatedListener(PointService pointService, VoucheryClient voucheryClient) {
        this.pointService = pointService;
        this.voucheryClient = voucheryClient;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void onEmployeeCreated(EmployeeCreatedEvent event) {
        if (event == null || event.userId() == null) {
            log.warn("Ignoring malformed employee-created event: {}", event);
            return;
        }
        log.info("Opening points wallet for user {}", event.userId());
        // Idempotent, so a redelivered message is harmless.
        pointService.openWallet(event.userId(), event.openingBalance());
        voucheryClient.createCustomer(event.userId());
    }
}
