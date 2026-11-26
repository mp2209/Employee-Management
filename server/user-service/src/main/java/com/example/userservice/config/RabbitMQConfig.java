package com.example.userservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Messaging topology for the "employee created" event.
 *
 * <p>The exchange, queue and binding are declared by both the producer (this service) and the
 * consumer (rewardPoint-service). Declarations are idempotent, and declaring the queue here means
 * events published before rewardPoint-service starts are queued instead of dropped.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "employee.events";
    public static final String QUEUE = "reward.employee-created";
    public static final String ROUTING_KEY = "employee.created";

    @Bean
    public DirectExchange employeeExchange() {
        return new DirectExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue employeeCreatedQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    public Binding employeeCreatedBinding(Queue employeeCreatedQueue, DirectExchange employeeExchange) {
        return BindingBuilder.bind(employeeCreatedQueue).to(employeeExchange).with(ROUTING_KEY);
    }

    /** Messages are plain JSON (no Java serialization), so any consumer can read them safely. */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
