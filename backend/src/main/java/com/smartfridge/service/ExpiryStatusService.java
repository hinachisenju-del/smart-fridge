package com.smartfridge.service;

import com.smartfridge.entity.ExpiryStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

@Service
public class ExpiryStatusService {

    private final Clock clock;

    public ExpiryStatusService(Clock clock) {
        this.clock = clock;
    }

    public LocalDate getToday() {
        return LocalDate.now(clock);
    }

    public ExpiryStatus evaluateStatus(LocalDate expiryDate) {
        if (expiryDate == null) {
            return ExpiryStatus.NO_EXPIRY;
        }
        LocalDate today = getToday();
        if (expiryDate.isBefore(today)) {
            return ExpiryStatus.EXPIRED;
        } else if (expiryDate.isEqual(today)) {
            return ExpiryStatus.EXPIRES_TODAY;
        } else if (!expiryDate.isAfter(today.plusDays(3))) {
            return ExpiryStatus.EXPIRING_SOON;
        } else {
            return ExpiryStatus.FRESH;
        }
    }

    public Long calculateDaysUntilExpiry(LocalDate expiryDate) {
        if (expiryDate == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(getToday(), expiryDate);
    }
}
