package com.example.userservice.event;

import com.example.userservice.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Forwards {@link EmployeeCreatedEvent}s to RabbitMQ.
 *
 * <p>Runs only after the surrounding database transaction commits, so consumers never see an
 * account that was rolled back.
 */
@Component
public class EmployeeEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EmployeeEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public EmployeeEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(EmployeeCreatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, event);
            log.info("Published employee-created event for user {}", event.userId());
        } catch (AmqpException e) {
            // The account itself is already committed; only the wallet provisioning is affected.
            log.error("Could not publish employee-created event for user {}", event.userId(), e);
        }
    }
}
