// File: server/rewardPoint-service/src/main/java/com/example/rewardpoint/service/PointService.java
package com.example.rewardpoint.service;

import com.example.rewardpoint.model.HistoryPoint;
import com.example.rewardpoint.model.Point;
import com.example.rewardpoint.repository.PointRepository;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class PointService {

    private static final Logger logger = LoggerFactory.getLogger(PointService.class);
    private static final long MONTHLY_BONUS_POINTS = 10L;

    private final PointRepository pointRepository;

    public PointService(PointRepository pointRepository) {
        this.pointRepository = pointRepository;
    }

    public Point createPointRecord(Long uid) {
        Point point = new Point();
        point.setUid(uid);
        point.setBonusPoint(0L);
        point.setTotalPoint(0L);
        return pointRepository.save(point);
    }

    public Point savePoint(Point point) {
        return pointRepository.save(point);
    }

    public List<Point> getListPointRecord() {
        return pointRepository.findAll();
    }

    public Optional<Point> getDetailPointRecord(Long uid) {
        return pointRepository.findByUid(uid);
    }

    @Scheduled(cron = "0 0 0 1 * ?") // Run at midnight on the first day of every month
    public void addMonthlyPoints() {
        logger.info("Running scheduled task: addMonthlyPoints");
        List<Point> allPoints = pointRepository.findAll();
        for (Point point : allPoints) {
            point.setTotalPoint(point.getTotalPoint() + MONTHLY_BONUS_POINTS);
            pointRepository.save(point);
            logger.info("Updated totalPoint for uid {}: {}", point.getUid(), point.getTotalPoint());
        }
    }

    @Transactional
    public Point sendPoint(Long managerId, Long employeeId, Long points, String message) {
        Point manager = pointRepository.findByUid(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerId));
        Point employee = pointRepository.findByUid(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        if (manager.getTotalPoint() < points) {
            throw new IllegalArgumentException("Insufficient points balance. Please try again later.");
        }

        // Deduct from manager
        manager.setBonusPoint(manager.getBonusPoint() - points);
        manager.setTotalPoint(manager.getTotalPoint() - points);

        // Credit to employee
        employee.setBonusPoint(employee.getBonusPoint() + points);
        employee.setTotalPoint(employee.getTotalPoint() + points);

        // History entries
        HistoryPoint historyPointEmployee = new HistoryPoint();
        historyPointEmployee.setId(new ObjectId());
        historyPointEmployee.setManagerId(managerId);
        historyPointEmployee.setPointsSent(points);
        historyPointEmployee.setDateSent(new Date());
        historyPointEmployee.setMessage(message);
        employee.getHistoryPoints().add(historyPointEmployee);

        HistoryPoint historyPointManager = new HistoryPoint();
        historyPointManager.setId(new ObjectId());
        historyPointManager.setManagerId(managerId);
        historyPointManager.setPointsSent(-points);
        historyPointManager.setDateSent(new Date());
        historyPointManager.setMessage("Sent points to UID: " + employeeId);
        manager.getHistoryPoints().add(historyPointManager);

        pointRepository.save(manager);
        return pointRepository.save(employee);
    }

    @Transactional
    public Point redeemPoints(Long employeeId, Long points, String message) {
        Point employee = pointRepository.findByUid(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        if (employee.getTotalPoint() < points) {
            throw new IllegalArgumentException("Not enough points to redeem.");
        }

        employee.setTotalPoint(employee.getTotalPoint() - points);

        HistoryPoint historyPoint = new HistoryPoint();
        historyPoint.setId(new ObjectId());
        historyPoint.setPointsSent(points);
        historyPoint.setDateSent(new Date());
        historyPoint.setMessage(message);
        employee.getHistoryPoints().add(historyPoint);

        return pointRepository.save(employee);
    }
}
