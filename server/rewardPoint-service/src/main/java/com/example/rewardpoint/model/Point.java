package com.example.rewardpoint.model;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/** A user's points wallet with an append-only history of credits and debits. */
@Data
@Document(collection = "points")
public class Point {
    @Id
    private ObjectId id;

    /** Owner's user id; one wallet per user. */
    @Indexed(unique = true)
    private Long uid;

    /** Points received from managers (decreases when a manager gives points away). */
    private Long bonusPoint;

    /** Spendable balance. Never negative: every debit is guarded atomically. */
    private Long totalPoint;

    private List<HistoryPoint> historyPoints = new ArrayList<>();
}
