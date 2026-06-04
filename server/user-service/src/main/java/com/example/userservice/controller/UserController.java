package com.example.userservice.controller;

import com.example.userservice.dto.*;
import com.example.userservice.security.JwtService;
import com.example.userservice.service.UserService;
import com.example.userservice.service.EmployeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final EmployeeService employeeService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserController(UserService userService,
                          EmployeeService employeeService,
                          BCryptPasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userService = userService;
        this.employeeService = employeeService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new LoginResponse("Username and password are required", null, null, null));
        }

        UserDTO userDTO = userService.getUserByUsername(loginRequest.getUsername());
        if (userDTO != null && passwordEncoder.matches(loginRequest.getPassword(), userDTO.getPassword())) {
            String token = jwtService.generateToken(userDTO.getId(), userDTO.getUsername(), userDTO.getRole());
            LoginResponse response = new LoginResponse("Login successful", token, userDTO.getRole(), userDTO.getId());
            return ResponseEntity.ok(response);
        }

        logger.warn("Failed login attempt for username '{}'", loginRequest.getUsername());
        return new ResponseEntity<>(
                new LoginResponse("Invalid username or password", null, null, null),
                HttpStatus.UNAUTHORIZED);
    }

    @PostMapping
    public ResponseEntity<UserEmployeeResponse> createUser(@RequestBody UserEmployeeRequest request) {
        boolean usernameExists = userService.usernameExists(request.getUser().getUsername());
        boolean identifyIdExists = employeeService.identifyIdExists(request.getEmployee().getIdentifyId());

        if (usernameExists || identifyIdExists) {
            UserEmployeeResponse errorResponse = new UserEmployeeResponse();
            errorResponse.setMessage("Username or Identify ID already exists");
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }

        UserDTO createdUser = userService.createUser(request.getUser());
        EmployeeDTO createdEmployee = employeeService.createEmployee(request.getEmployee(), createdUser.getId());

        UserEmployeeResponse response = new UserEmployeeResponse(createdUser, createdEmployee);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        UserDTO userDTO = userService.getUserByUsername(username);
        return userDTO != null
                ? ResponseEntity.ok(userDTO)
                : ResponseEntity.notFound().build();
    }

    @PutMapping("/{username}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String username, @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(username, userDTO);
        return updatedUser != null
                ? ResponseEntity.ok(updatedUser)
                : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        userService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}