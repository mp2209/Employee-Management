package com.example.rewardpoint.event;

/**
 * JSON payload published by user-service when a new employee account is committed.
 *
 * @param userId         id of the new user account (also the wallet id)
 * @param openingBalance points credited when the wallet is opened
 */
public record EmployeeCreatedEvent(Long userId, long openingBalance) {
}
