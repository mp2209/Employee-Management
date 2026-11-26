package com.example.requestservice.service;

import com.example.requestservice.exception.NotFoundException;
import com.example.requestservice.model.Request;
import com.example.requestservice.model.RequestStatus;
import com.example.requestservice.repository.RequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock
    private RequestRepository repository;
    @InjectMocks
    private RequestService service;

    @Test
    void newRequestsAlwaysStartAsPending() {
        Request request = request(RequestStatus.TYPE_LEAVE, RequestStatus.APPROVED);
        request.setReasonReject("pre-filled by a client");
        when(repository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request saved = service.createRequest(request);

        assertThat(saved.getStatus()).isEqualTo(RequestStatus.PENDING);
        assertThat(saved.getReasonReject()).isEmpty();
    }

    @Test
    void rejectsUnknownRequestType() {
        assertThatThrownBy(() -> service.createRequest(request("Vacation", null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void approvesPendingRequest() {
        when(repository.findById("r1")).thenReturn(Optional.of(request(RequestStatus.TYPE_LEAVE, RequestStatus.PENDING)));
        when(repository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.approveRequest("r1").getStatus()).isEqualTo(RequestStatus.APPROVED);
    }

    @Test
    void cannotReviewARequestTwice() {
        when(repository.findById("r1")).thenReturn(Optional.of(request(RequestStatus.TYPE_LEAVE, RequestStatus.REJECTED)));

        assertThatThrownBy(() -> service.approveRequest("r1")).isInstanceOf(IllegalStateException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void rejectionNeedsAReason() {
        assertThatThrownBy(() -> service.rejectRequest("r1", "  ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void unknownRequestIsNotFound() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getRequestById("missing")).isInstanceOf(NotFoundException.class);
    }

    private static Request request(String type, String status) {
        Request request = new Request();
        request.setRequestType(type);
        request.setStatus(status);
        return request;
    }
}
