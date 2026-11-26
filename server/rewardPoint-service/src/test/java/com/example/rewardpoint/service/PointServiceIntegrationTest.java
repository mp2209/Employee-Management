package com.example.rewardpoint.service;

import com.example.rewardpoint.exception.NotFoundException;
import com.example.rewardpoint.model.Point;
import com.example.rewardpoint.repository.PointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Runs against a real MongoDB in Docker; skipped when Docker is not available. */
@DataMongoTest(properties = "spring.data.mongodb.auto-index-creation=true")
@Import(PointService.class)
@Testcontainers(disabledWithoutDocker = true)
class PointServiceIntegrationTest {

    @Container
    @ServiceConnection
    static final MongoDBContainer MONGO = new MongoDBContainer("mongo:7.0");

    @Autowired
    private PointService pointService;
    @Autowired
    private PointRepository pointRepository;

    @BeforeEach
    void cleanDatabase() {
        pointRepository.deleteAll();
    }

    @Test
    void openingAWalletIsIdempotent() {
        pointService.openWallet(1L, 100);
        pointService.redeem(1L, 30, "coffee voucher");

        Point again = pointService.openWallet(1L, 100); // e.g. a redelivered RabbitMQ message

        assertThat(again.getTotalPoint()).isEqualTo(70);
        assertThat(pointRepository.count()).isEqualTo(1);
    }

    @Test
    void transferMovesPointsAndRecordsHistoryOnBothSides() {
        pointService.openWallet(1L, 100);
        pointService.openWallet(2L, 0);

        Point employee = pointService.transfer(1L, 2L, 40, "Great sprint!");

        Point manager = pointService.getWallet(1L);
        assertThat(manager.getTotalPoint()).isEqualTo(60);
        assertThat(employee.getTotalPoint()).isEqualTo(40);
        assertThat(employee.getBonusPoint()).isEqualTo(40);
        assertThat(employee.getHistoryPoints()).singleElement()
                .satisfies(entry -> {
                    assertThat(entry.getPointsSent()).isEqualTo(40);
                    assertThat(entry.getManagerId()).isEqualTo(1L);
                    assertThat(entry.getMessage()).isEqualTo("Great sprint!");
                });
        assertThat(manager.getHistoryPoints()).last()
                .satisfies(entry -> assertThat(entry.getPointsSent()).isEqualTo(-40));
    }

    @Test
    void cannotOverdrawOrSendNegativeOrSendToMissingWallet() {
        pointService.openWallet(1L, 10);
        pointService.openWallet(2L, 0);

        assertThatThrownBy(() -> pointService.transfer(1L, 2L, 11, "too much"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> pointService.transfer(1L, 2L, -5, "steal"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> pointService.transfer(1L, 99L, 5, "nobody"))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> pointService.transfer(1L, 1L, 5, "myself"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(pointService.getWallet(1L).getTotalPoint()).isEqualTo(10);
        assertThat(pointService.getWallet(2L).getTotalPoint()).isZero();
    }

    @Test
    void concurrentRedemptionsNeverOverdrawTheWallet() throws Exception {
        pointService.openWallet(7L, 100);

        // 50 parallel requests try to spend 10 points each from a 100-point wallet.
        ExecutorService pool = Executors.newFixedThreadPool(16);
        List<Callable<Boolean>> attempts = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            attempts.add(() -> {
                try {
                    pointService.redeem(7L, 10, "voucher");
                    return true;
                } catch (IllegalStateException insufficientBalance) {
                    return false;
                }
            });
        }
        long succeeded = 0;
        for (Future<Boolean> result : pool.invokeAll(attempts)) {
            if (result.get()) {
                succeeded++;
            }
        }
        pool.shutdown();

        Point wallet = pointService.getWallet(7L);
        assertThat(succeeded).isEqualTo(10);
        assertThat(wallet.getTotalPoint()).isZero();
        assertThat(wallet.getHistoryPoints()).filteredOn(entry -> entry.getPointsSent() < 0).hasSize(10);
    }

    @Test
    void monthlyBonusCreditsEveryWallet() {
        pointService.openWallet(1L, 0);
        pointService.openWallet(2L, 5);

        pointService.addMonthlyPoints();

        assertThat(pointService.getWallet(1L).getTotalPoint()).isEqualTo(PointService.MONTHLY_BONUS_POINTS);
        assertThat(pointService.getWallet(2L).getTotalPoint()).isEqualTo(5 + PointService.MONTHLY_BONUS_POINTS);
    }
}
