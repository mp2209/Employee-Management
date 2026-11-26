package com.example.userservice.controller;

import com.example.userservice.dto.LoginRequest;
import com.example.userservice.dto.LoginResponse;
import com.example.userservice.dto.UserDTO;
import com.example.userservice.dto.UserEmployeeRequest;
import com.example.userservice.dto.UserEmployeeResponse;
import com.example.userservice.security.JwtService;
import com.example.userservice.service.AccountService;
import com.example.userservice.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final AccountService accountService;
    private final JwtService jwtService;

    public UserController(UserService userService, AccountService accountService, JwtService jwtService) {
        this.userService = userService;
        this.accountService = accountService;
        this.jwtService = jwtService;
    }

    /** Public endpoint: exchanges username/password for a signed JWT. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new LoginResponse("Username and password are required", null, null, null));
        }

        return userService.authenticate(loginRequest.getUsername(), loginRequest.getPassword())
                .map(user -> ResponseEntity.ok(new LoginResponse(
                        "Login successful",
                        jwtService.generateToken(user.getId(), user.getUsername(), user.getRole()),
                        user.getRole(),
                        user.getId())))
                .orElseGet(() -> {
                    log.warn("Failed login attempt for username '{}'", loginRequest.getUsername());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(new LoginResponse("Invalid username or password", null, null, null));
                });
    }

    /**
     * Manager-only: creates a login account plus employee profile. The generated temporary
     * password is returned once so the manager can hand it to the new employee.
     */
    @PostMapping
    public ResponseEntity<UserEmployeeResponse> createUser(@RequestBody UserEmployeeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        String temporaryPassword = UserService.generateTemporaryPassword();
        AccountService.CreatedAccount account =
                accountService.createAccount(request.getUser(), request.getEmployee(), temporaryPassword, 0L);

        UserEmployeeResponse response = new UserEmployeeResponse(account.user(), account.employee());
        response.setTemporaryPassword(temporaryPassword);
        response.setMessage("Account created");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        UserDTO userDTO = userService.getUserByUsername(username);
        return userDTO != null ? ResponseEntity.ok(userDTO) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{username}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String username, @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(username, userDTO);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        userService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }
}
