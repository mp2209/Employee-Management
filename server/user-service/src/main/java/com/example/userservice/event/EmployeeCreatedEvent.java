package com.example.userservice.event;

/**
 * Published to RabbitMQ (as JSON) once a new employee account has been committed.
 * rewardPoint-service consumes it to open the employee's points wallet.
 *
 * @param userId         id of the new user account (also the wallet id)
 * @param openingBalance points credited when the wallet is opened (0 for regular accounts)
 */
public record EmployeeCreatedEvent(Long userId, long openingBalance) {
}
