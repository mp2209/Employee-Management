package com.example.requestservice.controller;

import com.example.requestservice.model.Request;
import com.example.requestservice.service.RequestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public List<Request> getAllRequests() {
        return requestService.getAllRequests();
    }

    @GetMapping("/{id}")
    public Request getRequestById(@PathVariable String id) {
        return requestService.getRequestById(id);
    }

    @PostMapping
    public Request createRequest(@RequestBody Request request) {
        return requestService.createRequest(request);
    }

    @PutMapping("/{id}/approve")
    public Request approveRequest(@PathVariable String id, @RequestParam String status) {
        return requestService.approveRequest(id, status);
    }

    @PutMapping("/{id}/reject")
    public Request rejectRequest(@PathVariable String id, @RequestParam String status, @RequestParam String reasonReject) {
        return requestService.rejectRequest(id, status, reasonReject);
    }
    @GetMapping("/not-approved")
    public List<Request> getNotApprovedRequests() {
        return requestService.getRequestsByStatus("Chưa duyệt");
    }

    @GetMapping("/approved")
    public List<Request> getApprovedRequests() {
        return requestService.getRequestsByStatusNot("Chưa duyệt");
    }

    @GetMapping("/leave")
    public List<Request> getLeaveRequests() {
        return requestService.getLeaveRequests();
    }

    @GetMapping("/update")
    public List<Request> getUpdateRequests() {
        return requestService.getUpdateTimeSheetRequests();
    }
}
