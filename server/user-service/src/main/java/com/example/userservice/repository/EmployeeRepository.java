package com.example.userservice.repository;

import com.example.userservice.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByIdentifyId(String identifyId);
}
