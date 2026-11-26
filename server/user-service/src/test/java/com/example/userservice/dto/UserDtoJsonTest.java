package com.example.userservice.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserDtoJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void passwordIsAcceptedInRequestsButNeverSerialized() throws Exception {
        UserDTO dto = objectMapper.readValue("{\"username\":\"alice\",\"password\":\"new-password\"}", UserDTO.class);
        assertThat(dto.getPassword()).isEqualTo("new-password");

        String json = objectMapper.writeValueAsString(dto);
        assertThat(json).contains("alice").doesNotContain("password");
    }
}
