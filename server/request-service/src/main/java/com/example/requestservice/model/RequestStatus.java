package com.example.requestservice.model;

import java.util.Set;

/** Request types and the statuses of the approval workflow. */
public final class RequestStatus {

    public static final String PENDING = "Pending";
    public static final String APPROVED = "Approved";
    public static final String REJECTED = "Rejected";

    public static final String TYPE_LEAVE = "Leave";
    public static final String TYPE_WORK_FROM_HOME = "WFH";
    public static final String TYPE_TIMESHEET_UPDATE = "Update";
    public static final Set<String> TYPES = Set.of(TYPE_LEAVE, TYPE_WORK_FROM_HOME, TYPE_TIMESHEET_UPDATE);

    private RequestStatus() {
    }
}
