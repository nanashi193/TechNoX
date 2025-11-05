package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.repositories.BillDetailRepository;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, propagation = Propagation.SUPPORTS, isolation = Isolation.READ_COMMITTED)

public class DashboardService implements IDashboardService {
    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final BillDetailRepository billDetailRepository;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /** Doanh thu hôm nay (HCM/VN) – chỉ tính Succeed/Confirmed */
    @Override
    public BigDecimal getTodayRevenue(ZoneId ignored) { // giữ chữ ký cũ, nhưng luôn dùng VN
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDateTime start = today.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = today.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return billRepository.sumRevenueBetween(start, end);
    }

    /** Doanh thu của 1 ngày bất kỳ (HCM/VN) – chỉ tính Succeed/Confirmed */
    @Override
    public BigDecimal getRevenueOf(LocalDate day, ZoneId ignored) { // luôn dùng VN
        LocalDateTime start = day.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = day.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return billRepository.sumRevenueBetween(start, end);
    }

    /** Tổng số đơn hôm nay (HCM/VN) – đếm mọi đơn trừ Cancelled */
    public Long getTodayOrderCount() {
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDateTime start = today.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = today.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return billRepository.countOrdersBetweenExcludingCancelled(start, end);
    }
    public Long getOrderCountOf(LocalDate day) {
        LocalDateTime start = day.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = day.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return billRepository.countOrdersBetweenExcludingCancelled(start, end);
    }

    /** KHÁCH HÀNG MỚI TRONG NGÀY (VN) */
    public Long getNewCustomersToday() {
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDateTime start = today.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = today.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return userRepository.countNewCustomersBetween(start, end);
    }

    /** KHÁCH HÀNG MỚI CỦA NGÀY TÙY CHỌN */
    public Long getNewCustomersOf(LocalDate day) {
        LocalDateTime start = day.atStartOfDay(VN_ZONE).toLocalDateTime();
        LocalDateTime end   = day.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();
        return userRepository.countNewCustomersBetween(start, end);
    }

    public List<Map<String, Object>> getOrderStatusStats() {
        return billRepository.countOrdersByStatus();
    }

    public List<Map<String,Object>> getTopProductsLast7Days(int limit) {
        // 7 ngày gần nhất tính đến hôm nay (VN)
        LocalDate today = LocalDate.now(VN_ZONE);                 // VN = ZoneId.of("Asia/Ho_Chi_Minh")
        LocalDate from  = today.minusDays(6);                // tổng cộng 7 ngày: [from..today]

        var start = from.atStartOfDay(VN_ZONE).toLocalDateTime(); // P1: 7 ngày hiện tại
        var end   = today.plusDays(1).atStartOfDay(VN_ZONE).toLocalDateTime();

        var prevStart = from.minusDays(7).atStartOfDay(VN_ZONE).toLocalDateTime(); // P0: 7 ngày trước đó
        var prevEnd   = start;

        return billDetailRepository.topProductsWithTrend(start, end, prevStart, prevEnd, limit);
    }
}
