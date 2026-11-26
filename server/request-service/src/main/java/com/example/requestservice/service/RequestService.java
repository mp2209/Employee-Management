package com.example.requestservice.service;

import com.example.requestservice.exception.NotFoundException;
import com.example.requestservice.model.Request;
import com.example.requestservice.model.RequestStatus;
import com.example.requestservice.repository.RequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/** Leave / work-from-home / timesheet-update requests and their approval workflow. */
@Service
public class RequestService {

    private final RequestRepository requestRepository;

    public RequestService(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    public Request getRequestById(String id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Request not found: " + id));
    }

    /** New requests always start as pending, whatever status the client sent. */
    public Request createRequest(Request request) {
        if (request == null || !RequestStatus.TYPES.contains(request.getRequestType())) {
            throw new IllegalArgumentException("requestType must be one of " + RequestStatus.TYPES);
        }
        request.setId(null);
        request.setStatus(RequestStatus.PENDING);
        request.setReasonReject("");
        return requestRepository.save(request);
    }

    public Request approveRequest(String id) {
        Request request = getPendingRequest(id);
        request.setStatus(RequestStatus.APPROVED);
        return requestRepository.save(request);
    }

    public Request rejectRequest(String id, String reasonReject) {
        if (reasonReject == null || reasonReject.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        Request request = getPendingRequest(id);
        request.setStatus(RequestStatus.REJECTED);
        request.setReasonReject(reasonReject.trim());
        return requestRepository.save(request);
    }

    public List<Request> getPendingRequests() {
        return requestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<Request> getReviewedRequests() {
        return requestRepository.findByStatusNot(RequestStatus.PENDING);
    }

    public List<Request> getRequestsByType(String requestType) {
        return requestRepository.findByRequestType(requestType);
    }

    private Request getPendingRequest(String id) {
        Request request = getRequestById(id);
        if (!RequestStatus.PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("Request " + id + " has already been reviewed");
        }
        return request;
    }
}
