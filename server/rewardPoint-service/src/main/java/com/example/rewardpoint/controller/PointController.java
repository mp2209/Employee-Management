package com.example.rewardpoint.controller;

import com.example.rewardpoint.model.Point;
import com.example.rewardpoint.security.CallerIdentity;
import com.example.rewardpoint.service.PointService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.example.rewardpoint.security.CallerIdentity.ROLE_HEADER;
import static com.example.rewardpoint.security.CallerIdentity.USER_ID_HEADER;

/**
 * Points wallets. Wallets are opened only through the employee-created event, never by a
 * client. Role checks happen at the api-gateway; ownership checks happen here.
 */
@RestController
@RequestMapping("/api/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    @GetMapping
    public List<Point> getAllWallets() {
        return pointService.getAllWallets();
    }

    @GetMapping("/{uid}")
    public Point getWallet(@PathVariable Long uid,
                           @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId,
                           @RequestHeader(value = ROLE_HEADER, required = false) String callerRole) {
        CallerIdentity.requireSelfOrManager(callerId, callerRole, uid);
        return pointService.getWallet(uid);
    }

    /** A manager gives some of their own points to an employee. */
    @PostMapping("/send")
    public Point sendPoints(@RequestParam Long managerId,
                            @RequestParam Long employeeId,
                            @RequestParam long points,
                            @RequestParam(defaultValue = "") String message,
                            @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId) {
        CallerIdentity.requireSelf(callerId, managerId);
        return pointService.transfer(managerId, employeeId, points, message);
    }

    @PostMapping("/redeem")
    public Point redeemPoints(@RequestParam Long employeeId,
                              @RequestParam long points,
                              @RequestParam(defaultValue = "") String message,
                              @RequestHeader(value = USER_ID_HEADER, required = false) Long callerId) {
        CallerIdentity.requireSelf(callerId, employeeId);
        return pointService.redeem(employeeId, points, message);
    }
}
