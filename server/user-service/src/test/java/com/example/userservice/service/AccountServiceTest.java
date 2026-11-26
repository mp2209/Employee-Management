package com.example.userservice.service;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.dto.UserDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserService userService;
    @Mock
    private EmployeeService employeeService;
    @InjectMocks
    private AccountService accountService;

    @Test
    void createsUserThenProfileWithTheOpeningBalance() {
        UserDTO createdUser = new UserDTO();
        createdUser.setId(9L);
        EmployeeDTO createdEmployee = new EmployeeDTO();
        when(employeeService.identifyIdExists("079000000009")).thenReturn(false);
        when(userService.createUser(any(UserDTO.class), anyString())).thenReturn(createdUser);
        when(employeeService.createEmployee(any(EmployeeDTO.class), any(Long.class), anyLong())).thenReturn(createdEmployee);

        AccountService.CreatedAccount account =
                accountService.createAccount(new UserDTO(), employee("079000000009"), "temp-password", 100L);

        assertThat(account.user()).isSameAs(createdUser);
        assertThat(account.employee()).isSameAs(createdEmployee);
        verify(userService).createUser(any(UserDTO.class), eq("temp-password"));
        verify(employeeService).createEmployee(any(EmployeeDTO.class), eq(9L),
                eq(100L));
    }

    @Test
    void duplicateIdentifyIdCreatesNothing() {
        when(employeeService.identifyIdExists("079000000009")).thenReturn(true);

        assertThatThrownBy(() -> accountService.createAccount(new UserDTO(), employee("079000000009"), "pw", 0L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Identify ID");
        verify(userService, never()).createUser(any(), any());
    }

    private static EmployeeDTO employee(String identifyId) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setIdentifyId(identifyId);
        return dto;
    }
}
