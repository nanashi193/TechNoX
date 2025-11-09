package com.g5.techdevices.techstore.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

public interface IDashboardService {
    BigDecimal getTodayRevenue(ZoneId zone);
    BigDecimal getRevenueOf(LocalDate day, ZoneId zone);
}
