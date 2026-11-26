package com.example.userservice.service;

import com.example.userservice.dto.UserDTO;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4); // fast for tests

    @Mock
    private UserRepository userRepository;

    private UserService userService() {
        return new UserService(userRepository, passwordEncoder);
    }

    @Test
    void storesOnlyABcryptHashOfThePassword() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        UserDTO created = userService().createUser(user("alice", "Employee"), "s3cret-pass");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isNotEqualTo("s3cret-pass").startsWith("$2a$");
        assertThat(passwordEncoder.matches("s3cret-pass", saved.getValue().getPassword())).isTrue();
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getPassword()).isNull();
    }

    @Test
    void rejectsDuplicateUsername() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> userService().createUser(user("alice", "Employee"), "pw"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    void rejectsUnknownRole() {
        assertThatThrownBy(() -> userService().createUser(user("bob", "Admin"), "pw"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Role");
    }

    @Test
    void authenticatesOnlyWithTheRightPassword() {
        User stored = new User();
        stored.setId(5L);
        stored.setUsername("alice");
        stored.setRole("Employee");
        stored.setPassword(passwordEncoder.encode("right-password"));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(stored));

        assertThat(userService().authenticate("alice", "right-password")).map(UserDTO::getId).contains(5L);
        assertThat(userService().authenticate("alice", "wrong-password")).isEmpty();
    }

    @Test
    void generatesRandomTemporaryPasswords() {
        long distinct = IntStream.range(0, 50)
                .mapToObj(i -> UserService.generateTemporaryPassword())
                .peek(password -> assertThat(password).hasSize(12).matches("[A-Za-z0-9]+"))
                .distinct()
                .count();

        assertThat(distinct).isEqualTo(50);
    }

    private static UserDTO user(String username, String role) {
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setRole(role);
        return dto;
    }
}
