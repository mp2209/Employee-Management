package com.example.requestservice.service;

import com.example.requestservice.model.Request;
import com.example.requestservice.repository.RequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
        return requestRepository.findById(id).orElse(null);
    }

    public Request createRequest(Request request) {
        return requestRepository.save(request);
    }

    public Request updateRequest(Request request) {
        return requestRepository.save(request);
    }

    public void deleteRequest(String id) {
        requestRepository.deleteById(id);
    }

    public Request approveRequest(String id, String status) {
        Request request = requestRepository.findById(id).orElse(null);
        if (request != null) {
            request.setStatus(status);
            return requestRepository.save(request);
        }
        return null;
    }

    public Request rejectRequest(String id, String status, String reasonReject) {
        Request request = requestRepository.findById(id).orElse(null);
        if (request != null) {
            request.setStatus(status);
            request.setReasonReject(reasonReject);
            return requestRepository.save(request);
        }
        return null;
    }
    public List<Request> getRequestsByStatus(String status) {
        return requestRepository.findByStatus(status);
    }

    public List<Request> getRequestsByStatusNot(String status) {
        return requestRepository.findByStatusNot(status);
    }

    public List<Request> getLeaveRequests() {
        return requestRepository.findByRequestType("Leave");
    }

    public List<Request> getUpdateTimeSheetRequests() {
        return requestRepository.findByRequestType("Update");
    }
}
