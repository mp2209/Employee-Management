package com.example.rewardpoint.config;

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
 * Consumer side of the "employee created" topology. Names and arguments must match the
 * declaration in user-service (declarations are idempotent on the broker).
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

    /**
     * JSON payloads are mapped onto the listener's parameter type, ignoring the producer's
     * class-name header, so the two services do not need to share Java classes.
     */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        converter.setAlwaysConvertToInferredType(true);
        return converter;
    }
}
