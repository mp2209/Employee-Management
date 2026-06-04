package com.example.userservice.controller;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<EmployeeDTO> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @PostMapping
    public EmployeeDTO createEmployee(@RequestBody EmployeeDTO employeeDTO, Long userId) {
        return employeeService.createEmployee(employeeDTO, userId);
    }

    @GetMapping("/{id}")
    public EmployeeDTO getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id);
    }

    @GetMapping("/name/{id}")
    public String getEmployeeNameById(@PathVariable Long id) {
        return employeeService.getEmployeeNameById(id);
    }

    @PutMapping("/{id}")
    public EmployeeDTO updateEmployee(@PathVariable Long id, @RequestBody EmployeeDTO employeeDTO) {
        return employeeService.updateEmployee(id, employeeDTO);
    }

    @DeleteMapping("/{id}")
    public void deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }

    @PostMapping("/{id}/avatar")
    public EmployeeDTO uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        String avatarBase64 = employeeService.uploadAvatar(file);
        EmployeeDTO employeeDTO = employeeService.getEmployeeById(id);
        employeeDTO.setAvatar(avatarBase64);
        return employeeService.updateEmployee(id, employeeDTO);
    }

    @PostMapping("/checkin")
    public ResponseEntity<String> checkIn(@RequestParam Long userId) {
        String response = employeeService.checkIn(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/checkout")
    public ResponseEntity<String> checkOut(@RequestParam Long userId) {
        String response = employeeService.checkOut(userId);
        return ResponseEntity.ok(response);
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PutMapping("/update-checkin-checkout")
    public ResponseEntity<String> updateCheckInCheckOut(@RequestParam Long userId, @RequestParam String day, @RequestParam String checkIn, @RequestParam String checkOut) {
        String response = employeeService.updateCheckInCheckOut(userId, day, checkIn, checkOut);
        return ResponseEntity.ok(response);
    }

}