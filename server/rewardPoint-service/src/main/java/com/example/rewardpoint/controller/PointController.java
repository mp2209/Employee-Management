package com.example.rewardpoint.controller;

import com.example.rewardpoint.model.Point;
import com.example.rewardpoint.service.PointService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    @PostMapping
    public Point createPoint(@RequestBody Point point) {
        return pointService.savePoint(point);
    }

    @GetMapping
    public List<Point> getListPointRecord() {
        return pointService.getListPointRecord();
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getDetailPointRecord(@PathVariable Long uid) {
        Optional<Point> point = pointService.getDetailPointRecord(uid);
        return point.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(Map.of("error", "Point record not found for uid " + uid)));
    }

    @PostMapping("/send")
    public Point sendPoint(@RequestParam Long managerId,
                           @RequestParam Long employeeId,
                           @RequestParam Long points,
                           @RequestParam String message) {
        return pointService.sendPoint(managerId, employeeId, points, message);
    }

    @PostMapping("/redeem")
    public Point redeemPoints(@RequestParam Long employeeId,
                              @RequestParam Long points,
                              @RequestParam String message) {
        return pointService.redeemPoints(employeeId, points, message);
    }
}
