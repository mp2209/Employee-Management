package com.example.userservice.service;

import com.example.userservice.dto.UserDTO;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    public static final Set<String> ROLES = Set.of("Manager", "Employee");

    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Random password for a new account; avoids look-alike characters such as 0/O and 1/l. */
    public static String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }

    public boolean usernameExists(String username) {
        return username != null && userRepository.existsByUsername(username.trim());
    }

    /** Returns the user when the credentials are valid. */
    public Optional<UserDTO> authenticate(String username, String rawPassword) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(rawPassword, user.getPassword()))
                .map(this::convertToDTO);
    }

    /** Creates a login account; only a BCrypt hash of {@code rawPassword} is stored. */
    @Transactional
    public UserDTO createUser(UserDTO userDTO, String rawPassword) {
        if (userDTO == null || isBlank(userDTO.getUsername())) {
            throw new IllegalArgumentException("Username is required");
        }
        if (isBlank(rawPassword)) {
            throw new IllegalArgumentException("Password is required");
        }
        String username = userDTO.getUsername().trim();
        if (usernameExists(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        String role = isBlank(userDTO.getRole()) ? "Employee" : userDTO.getRole();
        if (!ROLES.contains(role)) {
            throw new IllegalArgumentException("Role must be one of " + ROLES);
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setStatus(isBlank(userDTO.getStatus()) ? "Active" : userDTO.getStatus());
        return convertToDTO(userRepository.save(user));
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::convertToDTO).toList();
    }

    public UserDTO getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(this::convertToDTO).orElse(null);
    }

    @Transactional
    public UserDTO updateUser(String username, UserDTO userDTO) {
        return userRepository.findByUsername(username)
                .map(existing -> {
                    if (!isBlank(userDTO.getPassword())) {
                        existing.setPassword(passwordEncoder.encode(userDTO.getPassword()));
                    }
                    if (!isBlank(userDTO.getRole())) {
                        if (!ROLES.contains(userDTO.getRole())) {
                            throw new IllegalArgumentException("Role must be one of " + ROLES);
                        }
                        existing.setRole(userDTO.getRole());
                    }
                    if (!isBlank(userDTO.getStatus())) {
                        existing.setStatus(userDTO.getStatus());
                    }
                    return convertToDTO(userRepository.save(existing));
                })
                .orElse(null);
    }

    @Transactional
    public void deleteUser(String username) {
        userRepository.findByUsername(username).ifPresent(userRepository::delete);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private UserDTO convertToDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setRole(user.getRole());
        userDTO.setStatus(user.getStatus());
        return userDTO;
    }
}
