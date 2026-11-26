package com.example.rewardpoint.model;

import lombok.Data;
import org.bson.types.ObjectId;

import java.util.Date;

/** One wallet movement: positive {@code pointsSent} is a credit, negative is a debit. */
@Data
public class HistoryPoint {
    private ObjectId id;
    private Long managerId;
    private Long pointsSent;
    private Date dateSent;
    private String message;
}
