package com.example.userservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeDTO {
    private Long id;

    /** Id of the login account that owns this profile (read-only). */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long userId;

    private String identifyId;
    private String name;
    private String birthDate;
    private String avatar; // Base64 encoded image
    private String gender;
    private String taxNumber;
    private String address;
    private String phoneNumber;
    private String bankNumber;
    private String position;
    private String department;
    private String status;
}
