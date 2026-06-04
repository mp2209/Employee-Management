package com.example.userservice.service;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.model.Employee;
import com.example.userservice.model.User;
import com.example.userservice.model.Worktime;
import com.example.userservice.repository.EmployeeRepository;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.repository.WorktimeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectOutputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final WorktimeRepository worktimeRepository;
    private final RabbitTemplate rabbitTemplate;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           WorktimeRepository worktimeRepository,
                           RabbitTemplate rabbitTemplate) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.worktimeRepository = worktimeRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    public boolean identifyIdExists(String identifyId) {
        return employeeRepository.existsByIdentifyId(identifyId);
    }

    public String getEmployeeNameById(Long id) {
        EmployeeDTO employee = getEmployeeById(id);
        return employee != null ? employee.getName() : null;
    }

    public EmployeeDTO getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public String uploadAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is empty");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException(
                    "Avatar too large: " + file.getSize() + " bytes (max " + MAX_AVATAR_BYTES + ")");
        }
        return Base64.getEncoder().encodeToString(file.getBytes());
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO, Long userId) {
        if (employeeDTO == null) {
            throw new IllegalArgumentException("EmployeeDTO cannot be null");
        }

        if (employeeRepository.existsByIdentifyId(employeeDTO.getIdentifyId())) {
            throw new IllegalArgumentException("Identify ID already exists");
        }

        Employee employee = convertToEntity(employeeDTO);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        employee.setUser(user);

        Employee savedEmployee = employeeRepository.save(employee);
        publishEmployeeCreated(savedEmployee.getUser().getId());
        return convertToDTO(savedEmployee);
    }

    private void publishEmployeeCreated(Long userId) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(userId);
            oos.flush();
            rabbitTemplate.convertAndSend("employeeQueue", bos.toByteArray());
        } catch (IOException e) {
            logger.error("Failed to publish employee-created event for user {}", userId, e);
            throw new RuntimeException("Failed to publish employee-created event", e);
        }
    }

    @Transactional
    public String checkIn(Long userId) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        if (worktimeRepository.findByUserIdAndDay(userId, today).isPresent()) {
            return "Already checked in for today";
        }

        Worktime worktime = new Worktime();
        worktime.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found")));
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
                            .orElseThrow(() -> new IllegalArgumentException("User not found")));
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

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
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
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
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
