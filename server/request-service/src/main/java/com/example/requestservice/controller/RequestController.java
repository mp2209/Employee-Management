package com.example.requestservice.controller;

import com.example.requestservice.model.Request;
import com.example.requestservice.model.RequestStatus;
import com.example.requestservice.service.RequestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Approval endpoints are restricted to managers by the api-gateway. */
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

    /** The optional {@code status} parameter is accepted for backward compatibility and ignored. */
    @PutMapping("/{id}/approve")
    public Request approveRequest(@PathVariable String id,
                                  @RequestParam(required = false) String status) {
        return requestService.approveRequest(id);
    }

    @PutMapping("/{id}/reject")
    public Request rejectRequest(@PathVariable String id,
                                 @RequestParam(required = false) String status,
                                 @RequestParam String reasonReject) {
        return requestService.rejectRequest(id, reasonReject);
    }

    @GetMapping("/not-approved")
    public List<Request> getNotApprovedRequests() {
        return requestService.getPendingRequests();
    }

    @GetMapping("/approved")
    public List<Request> getApprovedRequests() {
        return requestService.getReviewedRequests();
    }

    @GetMapping("/leave")
    public List<Request> getLeaveRequests() {
        return requestService.getRequestsByType(RequestStatus.TYPE_LEAVE);
    }

    @GetMapping("/update")
    public List<Request> getUpdateRequests() {
        return requestService.getRequestsByType(RequestStatus.TYPE_TIMESHEET_UPDATE);
    }
}
