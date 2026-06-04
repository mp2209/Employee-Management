package com.example.requestservice.dto;

import lombok.Data;

@Data
public class RequestDTO {
    private String id;
    private String employeeId;
    private String reason;
    private String status;
    private String timeEnd;
    private String requestReason;   // formerly lyDoYeuCau
    private String device;          // formerly thietBi
    private String requestStatus;   // formerly trangThai
}
