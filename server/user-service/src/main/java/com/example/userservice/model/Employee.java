package com.example.userservice.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String identifyId;
    private String name;
    private String birthDate;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatar; // Base64 encoded string

    private String gender;
    private String taxNumber;
    private String address;
    private String phoneNumber;
    private String bankNumber;
    private String position;
    private String department;
    private String status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;
}