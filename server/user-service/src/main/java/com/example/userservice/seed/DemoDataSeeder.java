package com.example.userservice.seed;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.dto.UserDTO;
import com.example.userservice.service.AccountService;
import com.example.userservice.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Creates two demo accounts on startup so the app can be tried right away:
 * {@code admin / admin123} (Manager) and {@code employee / employee123} (Employee).
 *
 * <p>Accounts go through the normal creation flow, so their points wallets are opened by
 * rewardPoint-service via RabbitMQ. Runs only when {@code app.demo-data.enabled=true}
 * (env {@code SEED_DEMO_DATA}) and skips accounts that already exist.
 */
@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** The demo manager starts with a budget so "Give points" works out of the box. */
    private static final long MANAGER_OPENING_BALANCE = 100L;

    private final AccountService accountService;
    private final UserService userService;

    public DemoDataSeeder(AccountService accountService, UserService userService) {
        this.accountService = accountService;
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed("admin", "admin123", "Manager", MANAGER_OPENING_BALANCE,
                employee("079090000001", "An Nguyen", "15/01/1990", "Male", "Engineering Manager"));
        seed("employee", "employee123", "Employee", 0L,
                employee("079095000002", "Binh Tran", "20/05/1995", "Female", "Software Engineer"));
    }

    private void seed(String username, String password, String role, long openingBalance, EmployeeDTO employee) {
        if (userService.usernameExists(username)) {
            return;
        }
        UserDTO user = new UserDTO();
        user.setUsername(username);
        user.setRole(role);
        user.setStatus("Active");
        try {
            accountService.createAccount(user, employee, password, openingBalance);
            log.info("Created demo account '{}' ({})", username, role);
        } catch (RuntimeException e) {
            // e.g. another instance seeded concurrently; never block startup on demo data.
            log.warn("Could not create demo account '{}': {}", username, e.getMessage());
        }
    }

    private static EmployeeDTO employee(String identifyId, String name, String birthDate, String gender, String position) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setIdentifyId(identifyId);
        dto.setName(name);
        dto.setBirthDate(birthDate);
        dto.setGender(gender);
        dto.setPosition(position);
        dto.setDepartment("Engineering");
        dto.setAddress("Ho Chi Minh City");
        dto.setStatus("Active");
        return dto;
    }
}
