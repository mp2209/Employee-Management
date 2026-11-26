package com.example.userservice.service;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.event.EmployeeCreatedEvent;
import com.example.userservice.exception.NotFoundException;
import com.example.userservice.model.Employee;
import com.example.userservice.model.User;
import com.example.userservice.model.Worktime;
import com.example.userservice.repository.EmployeeRepository;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.repository.WorktimeRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;

@Service
public class EmployeeService {

    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final WorktimeRepository worktimeRepository;
    private final ApplicationEventPublisher events;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           WorktimeRepository worktimeRepository,
                           ApplicationEventPublisher events) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.worktimeRepository = worktimeRepository;
        this.events = events;
    }

    public boolean identifyIdExists(String identifyId) {
        return identifyId != null && employeeRepository.existsByIdentifyId(identifyId);
    }

    public EmployeeDTO getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + id));
    }

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::convertToDTO).toList();
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO, Long userId) {
        return createEmployee(employeeDTO, userId, 0L);
    }

    /**
     * Creates the employee profile for an existing user and announces it, once the transaction
     * commits, so rewardPoint-service can open a wallet with {@code openingBalance} points.
     */
    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO, Long userId, long openingBalance) {
        if (employeeDTO == null) {
            throw new IllegalArgumentException("Employee details are required");
        }
        if (employeeDTO.getIdentifyId() == null || employeeDTO.getIdentifyId().isBlank()) {
            throw new IllegalArgumentException("Identify ID is required");
        }
        if (identifyIdExists(employeeDTO.getIdentifyId())) {
            throw new IllegalArgumentException("Identify ID already exists");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        Employee employee = convertToEntity(employeeDTO);
        employee.setUser(user);
        Employee saved = employeeRepository.save(employee);

        events.publishEvent(new EmployeeCreatedEvent(user.getId(), openingBalance));
        return convertToDTO(saved);
    }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + id));
        employee.setName(employeeDTO.getName());
        employee.setBirthDate(employeeDTO.getBirthDate());
        employee.setAvatar(employeeDTO.getAvatar());
        employee.setGender(employeeDTO.getGender());
        employee.setTaxNumber(employeeDTO.getTaxNumber());
        employee.setAddress(employeeDTO.getAddress());
        employee.setPhoneNumber(employeeDTO.getPhoneNumber());
        employee.setBankNumber(employeeDTO.getBankNumber());
        employee.setPosition(employeeDTO.getPosition());
        employee.setDepartment(employeeDTO.getDepartment());
        employee.setStatus(employeeDTO.getStatus());
        return convertToDTO(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeDTO updateAvatar(Long id, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is empty");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("Avatar too large (max 2 MB)");
        }
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + id));
        employee.setAvatar(Base64.getEncoder().encodeToString(file.getBytes()));
        return convertToDTO(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    @Transactional
    public String checkIn(Long userId) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        if (worktimeRepository.findByUserIdAndDay(userId, today).isPresent()) {
            return "Already checked in for today";
        }

        Worktime worktime = new Worktime();
        worktime.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId)));
        worktime.setTimeStart(LocalTime.now().format(TIME_FORMAT));
        worktime.setDay(today);
        worktimeRepository.save(worktime);
        return "Check-in successful";
    }

    @Transactional
    public String checkOut(Long userId) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        Worktime worktime = worktimeRepository.findByUserIdAndDay(userId, today)
                .orElseThrow(() -> new IllegalArgumentException("No check-in record found for today"));
        worktime.setTimeEnd(LocalTime.now().format(TIME_FORMAT));
        worktimeRepository.save(worktime);
        return "Check-out successful";
    }

    @Transactional
    public String updateCheckInCheckOut(Long userId, String day, String checkIn, String checkOut) {
        Worktime worktime = worktimeRepository.findByUserIdAndDay(userId, day)
                .orElseGet(() -> {
                    Worktime newWorktime = new Worktime();
                    newWorktime.setUser(userRepository.findById(userId)
                            .orElseThrow(() -> new NotFoundException("User not found: " + userId)));
                    newWorktime.setDay(day);
                    return newWorktime;
                });

        try {
            worktime.setTimeStart(LocalTime.parse(checkIn, TIME_FORMAT).format(TIME_FORMAT));
            worktime.setTimeEnd(LocalTime.parse(checkOut, TIME_FORMAT).format(TIME_FORMAT));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid time format. Please use HH:mm:ss format.");
        }

        worktimeRepository.save(worktime);
        return "Check-in and check-out times updated successfully";
    }

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        // Reading the id of a lazy association does not trigger a query.
        dto.setUserId(employee.getUser() != null ? employee.getUser().getId() : null);
        dto.setIdentifyId(employee.getIdentifyId());
        dto.setName(employee.getName());
        dto.setBirthDate(employee.getBirthDate());
        dto.setAvatar(employee.getAvatar());
        dto.setGender(employee.getGender());
        dto.setTaxNumber(employee.getTaxNumber());
        dto.setAddress(employee.getAddress());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setBankNumber(employee.getBankNumber());
        dto.setPosition(employee.getPosition());
        dto.setDepartment(employee.getDepartment());
        dto.setStatus(employee.getStatus());
        return dto;
    }

    private Employee convertToEntity(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setIdentifyId(dto.getIdentifyId());
        employee.setName(dto.getName());
        employee.setBirthDate(dto.getBirthDate());
        employee.setAvatar(dto.getAvatar());
        employee.setGender(dto.getGender());
        employee.setTaxNumber(dto.getTaxNumber());
        employee.setAddress(dto.getAddress());
        employee.setPhoneNumber(dto.getPhoneNumber());
        employee.setBankNumber(dto.getBankNumber());
        employee.setPosition(dto.getPosition());
        employee.setDepartment(dto.getDepartment());
        employee.setStatus(dto.getStatus());
        return employee;
    }
}
