package com.example.userservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserEmployeeResponse {
    private UserDTO user;
    private EmployeeDTO employee;

    /** Generated password for a new account. Returned once, at creation time, and never stored in plain text. */
    private String temporaryPassword;

    private String message;

    public UserEmployeeResponse(UserDTO user, EmployeeDTO employee) {
        this.user = user;
        this.employee = employee;
    }
}
