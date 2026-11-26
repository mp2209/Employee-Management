package com.example.rewardpoint.service;

import com.example.rewardpoint.exception.NotFoundException;
import com.example.rewardpoint.model.HistoryPoint;
import com.example.rewardpoint.model.Point;
import com.example.rewardpoint.repository.PointRepository;
import com.mongodb.client.result.UpdateResult;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * Points wallets.
 *
 * <p>Balances change only through single-document atomic updates ({@code findAndModify} with
 * {@code $inc}). Each debit is guarded by a {@code totalPoint >= amount} condition evaluated by
 * MongoDB in the same operation, so concurrent requests can never overdraw a wallet and no
 * read-modify-write races exist. A standalone MongoDB has no multi-document transactions, so a
 * transfer is a guarded debit followed by a credit, with a compensating refund if the credit fails.
 */
@Service
public class PointService {

    private static final Logger log = LoggerFactory.getLogger(PointService.class);
    static final long MONTHLY_BONUS_POINTS = 10L;

    private final PointRepository pointRepository;
    private final MongoTemplate mongoTemplate;

    public PointService(PointRepository pointRepository, MongoTemplate mongoTemplate) {
        this.pointRepository = pointRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<Point> getAllWallets() {
        return pointRepository.findAll();
    }

    public Point getWallet(Long uid) {
        return pointRepository.findByUid(uid)
                .orElseThrow(() -> new NotFoundException("No points wallet for user " + uid));
    }

    /**
     * Opens a wallet for a new user. Idempotent: calling it again (e.g. for a redelivered
     * message) neither duplicates the wallet nor resets its balance.
     */
    public Point openWallet(Long uid, long openingBalance) {
        long balance = Math.max(0, openingBalance);
        List<HistoryPoint> history = new ArrayList<>();
        if (balance > 0) {
            history.add(entry(null, balance, "Opening balance"));
        }
        Update update = new Update()
                .setOnInsert("bonusPoint", 0L)
                .setOnInsert("totalPoint", balance)
                .setOnInsert("historyPoints", history);
        return mongoTemplate.findAndModify(byUid(uid), update,
                FindAndModifyOptions.options().upsert(true).returnNew(true), Point.class);
    }

    /** Moves points from a manager's wallet to an employee's wallet. */
    public Point transfer(Long fromUid, Long toUid, long points, String message) {
        requirePositive(points);
        if (Objects.equals(fromUid, toUid)) {
            throw new IllegalArgumentException("You cannot send points to yourself");
        }
        if (!pointRepository.existsByUid(toUid)) {
            throw new NotFoundException("No points wallet for user " + toUid);
        }

        Point debited = mongoTemplate.findAndModify(
                byUid(fromUid).addCriteria(Criteria.where("totalPoint").gte(points)),
                new Update().inc("totalPoint", -points).inc("bonusPoint", -points)
                        .push("historyPoints", entry(fromUid, -points, "Sent points to UID: " + toUid)),
                FindAndModifyOptions.options().returnNew(true), Point.class);
        if (debited == null) {
            throw debitFailure(fromUid, "Insufficient points balance");
        }

        Point credited = mongoTemplate.findAndModify(
                byUid(toUid),
                new Update().inc("totalPoint", points).inc("bonusPoint", points)
                        .push("historyPoints", entry(fromUid, points, message)),
                FindAndModifyOptions.options().returnNew(true), Point.class);
        if (credited == null) {
            // The recipient's wallet disappeared after the check: give the sender's points back.
            mongoTemplate.updateFirst(byUid(fromUid),
                    new Update().inc("totalPoint", points).inc("bonusPoint", points)
                            .push("historyPoints", entry(null, points, "Refund: transfer to UID " + toUid + " failed")),
                    Point.class);
            throw new NotFoundException("No points wallet for user " + toUid);
        }
        return credited;
    }

    /** Spends points, e.g. when an employee redeems a voucher. */
    public Point redeem(Long uid, long points, String message) {
        requirePositive(points);
        Point updated = mongoTemplate.findAndModify(
                byUid(uid).addCriteria(Criteria.where("totalPoint").gte(points)),
                new Update().inc("totalPoint", -points)
                        .push("historyPoints", entry(null, -points, message)),
                FindAndModifyOptions.options().returnNew(true), Point.class);
        if (updated == null) {
            throw debitFailure(uid, "Not enough points to redeem");
        }
        return updated;
    }

    /** Midnight on the 1st of every month: everyone gets the monthly bonus, in one atomic update. */
    @Scheduled(cron = "0 0 0 1 * ?")
    public void addMonthlyPoints() {
        UpdateResult result = mongoTemplate.updateMulti(new Query(),
                new Update().inc("totalPoint", MONTHLY_BONUS_POINTS), Point.class);
        log.info("Monthly bonus: +{} points for {} wallets", MONTHLY_BONUS_POINTS, result.getModifiedCount());
    }

    private RuntimeException debitFailure(Long uid, String insufficientMessage) {
        return pointRepository.existsByUid(uid)
                ? new IllegalStateException(insufficientMessage)
                : new NotFoundException("No points wallet for user " + uid);
    }

    private static void requirePositive(long points) {
        if (points <= 0) {
            throw new IllegalArgumentException("Points must be a positive number");
        }
    }

    private static Query byUid(Long uid) {
        return Query.query(Criteria.where("uid").is(uid));
    }

    private static HistoryPoint entry(Long managerId, long points, String message) {
        HistoryPoint entry = new HistoryPoint();
        entry.setId(new ObjectId());
        entry.setManagerId(managerId);
        entry.setPointsSent(points);
        entry.setDateSent(new Date());
        entry.setMessage(message);
        return entry;
    }
}
