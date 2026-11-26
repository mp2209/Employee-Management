package com.example.userservice.service;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.dto.UserDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates a login account together with its employee profile. */
@Service
public class AccountService {

    private final UserService userService;
    private final EmployeeService employeeService;

    public AccountService(UserService userService, EmployeeService employeeService) {
        this.userService = userService;
        this.employeeService = employeeService;
    }

    public record CreatedAccount(UserDTO user, EmployeeDTO employee) {
    }

    /**
     * Creates the user and the employee profile in a single transaction, so a failure never
     * leaves a login account without a profile. The employee-created event is published only
     * after the commit.
     */
    @Transactional
    public CreatedAccount createAccount(UserDTO user, EmployeeDTO employee, String rawPassword, long openingBalance) {
        if (user == null || employee == null) {
            throw new IllegalArgumentException("Both user and employee details are required");
        }
        if (employeeService.identifyIdExists(employee.getIdentifyId())) {
            throw new IllegalArgumentException("Identify ID already exists");
        }
        UserDTO createdUser = userService.createUser(user, rawPassword);
        EmployeeDTO createdEmployee = employeeService.createEmployee(employee, createdUser.getId(), openingBalance);
        return new CreatedAccount(createdUser, createdEmployee);
    }
}
