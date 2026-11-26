package com.example.rewardpoint.config;

import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.bson.types.ObjectId;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /** Serialize MongoDB ObjectIds as their hex string instead of a nested timestamp object. */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer objectIdAsString() {
        return builder -> builder.serializerByType(ObjectId.class, ToStringSerializer.instance);
    }
}
