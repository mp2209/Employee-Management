package com.example.userservice.service;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.dto.UserDTO;
import com.example.userservice.model.Employee;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.repository.EmployeeRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean usernameExists(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    public String getEmployeeNameById(Long id) {
        Employee employee = getEmployeeById(id);
        return employee != null ? employee.getName() : null;
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public UserDTO createUser(UserDTO userDTO) {
        if (userDTO == null) {
            throw new IllegalArgumentException("UserDTO cannot be null");
        }

        // Default password is generated and must be changed on first login.
        // Stored as BCrypt hash so it is never saved in plain text.
        String defaultPassword = generateRandomPassword();
        String hashedPassword = passwordEncoder.encode(defaultPassword);
        userDTO.setPassword(hashedPassword);

        boolean usernameExists = userRepository.findByUsername(userDTO.getUsername()).isPresent();
        boolean identifyIdExists = employeeRepository.existsByIdentifyId(userDTO.getUsername());

        if (usernameExists || identifyIdExists) {
            throw new IllegalArgumentException("Username or Identify ID already exists");
        }

        User user = convertToEntity(userDTO);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }


    public UserDTO getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(this::convertToDTO).orElse(null);
    }


    public UserDTO updateUser(String username, UserDTO userDTO) {
        return userRepository.findByUsername(username)
                .map(existingUser -> {
                    existingUser.setPassword(userDTO.getPassword() != null
                            ? passwordEncoder.encode(userDTO.getPassword())
                            : existingUser.getPassword());
                    existingUser.setRole(userDTO.getRole());
                    existingUser.setStatus(userDTO.getStatus());
                    return convertToDTO(userRepository.save(existingUser));
                })
                .orElse(null);
    }

    public void deleteUser(String username) {
        userRepository.findByUsername(username)
                .ifPresent(userRepository::delete);
    }

    private String generateRandomPassword() {
        // 10-char alphanumeric password (uppercase + digits)
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(10);
        java.util.Random random = new java.security.SecureRandom() instanceof java.util.Random
                ? new java.security.SecureRandom()
                : new java.util.Random();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private User convertToEntity(UserDTO userDTO) {
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(userDTO.getPassword());
        user.setRole(userDTO.getRole());
        user.setStatus(userDTO.getStatus());
        return user;
    }

    private UserDTO convertToDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setPassword(user.getPassword());
        userDTO.setRole(user.getRole());
        userDTO.setStatus(user.getStatus());
        return userDTO;
    }
}