package com.example.userservice.controller;

import com.example.userservice.dto.EmployeeDTO;
import com.example.userservice.security.CallerIdentity;
import com.example.userservice.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import static com.example.userservice.security.CallerIdentity.ROLE_HEADER;
import static com.example.userservice.security.CallerIdentity.USER_ID_HEADER;

/**
 * Employee profiles and attendance. Role checks happen at the api-gateway; ownership checks
 * (an employee may only read or change their own profile) happen here.
 */
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
    public EmployeeDTO createEmployee(@RequestBody EmployeeDTO employeeDTO, @RequestParam Long userId) {
        return employeeService.createEmployee(employeeDTO, userId);
    }

    @GetMapping("/{id}")
    public EmployeeDTO getEmployeeById(@PathVariable Long id,
                                       @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId,
                                       @RequestHeader(value = ROLE_HEADER, required = false) String callerRole) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        CallerIdentity.requireSelfOrManager(callerId, callerRole, employee.getUserId());
        return employee;
    }

    @GetMapping("/name/{id}")
    public String getEmployeeNameById(@PathVariable Long id,
                                      @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId,
                                      @RequestHeader(value = ROLE_HEADER, required = false) String callerRole) {
        return getEmployeeById(id, callerId, callerRole).getName();
    }

    @PutMapping("/{id}")
    public EmployeeDTO updateEmployee(@PathVariable Long id,
                                      @RequestBody EmployeeDTO employeeDTO,
                                      @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId,
                                      @RequestHeader(value = ROLE_HEADER, required = false) String callerRole) {
        CallerIdentity.requireSelfOrManager(callerId, callerRole, employeeService.getEmployeeById(id).getUserId());
        return employeeService.updateEmployee(id, employeeDTO);
    }

    @DeleteMapping("/{id}")
    public void deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }

    @PostMapping("/{id}/avatar")
    public EmployeeDTO uploadAvatar(@PathVariable Long id,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId,
                                    @RequestHeader(value = ROLE_HEADER, required = false) String callerRole) throws IOException {
        CallerIdentity.requireSelfOrManager(callerId, callerRole, employeeService.getEmployeeById(id).getUserId());
        return employeeService.updateAvatar(id, file);
    }

    @PostMapping("/checkin")
    public ResponseEntity<String> checkIn(@RequestParam Long userId,
                                          @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId) {
        CallerIdentity.requireSelf(callerId, userId);
        return ResponseEntity.ok(employeeService.checkIn(userId));
    }

    @PostMapping("/checkout")
    public ResponseEntity<String> checkOut(@RequestParam Long userId,
                                           @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId) {
        CallerIdentity.requireSelf(callerId, userId);
        return ResponseEntity.ok(employeeService.checkOut(userId));
    }

    @PutMapping("/update-checkin-checkout")
    public ResponseEntity<String> updateCheckInCheckOut(@RequestParam Long userId,
                                                        @RequestParam String day,
                                                        @RequestParam String checkIn,
                                                        @RequestParam String checkOut) {
        return ResponseEntity.ok(employeeService.updateCheckInCheckOut(userId, day, checkIn, checkOut));
    }
}
