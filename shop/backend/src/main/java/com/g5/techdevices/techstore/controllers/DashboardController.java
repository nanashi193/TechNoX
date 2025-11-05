package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {


    private final DashboardService dashboardService;

    @GetMapping("/revenue/today")
    public Map<String, Object> getTodayRevenue() {
        return Map.of("revenue", dashboardService.getTodayRevenue(null));
    }

    @GetMapping("/revenue/by-date")
    public Map<String, Object> getRevenueByDate(@RequestParam("date") String dateStr) {
        LocalDate d = LocalDate.parse(dateStr.trim());
        return Map.of("date", d, "revenue", dashboardService.getRevenueOf(d, null));
    }

    @GetMapping("/orders/today")
    public Map<String, Object> getTodayOrders() {
        return Map.of("totalOrders", dashboardService.getTodayOrderCount());
    }

    @GetMapping("/orders/by-date")
    public Map<String, Object> getOrdersByDate(@RequestParam("date") String dateStr) {
        LocalDate d = LocalDate.parse(dateStr.trim());
        return Map.of("date", d, "totalOrders", dashboardService.getOrderCountOf(d));
    }

    @GetMapping("/customers/new/today")
    public Map<String, Object> getNewCustomersToday() {
        return Map.of("newCustomers", dashboardService.getNewCustomersToday());
    }

    @GetMapping("/customers/new/by-date")
    public Map<String, Object> getNewCustomersByDate(@RequestParam("date") String dateStr) {
        LocalDate d = LocalDate.parse(dateStr.trim());
        return Map.of("date", d, "newCustomers", dashboardService.getNewCustomersOf(d));
    }

    @GetMapping("/orders/status")
    public Map<String, Object> getOrderStatusStats() {
        return Map.of("statusStats", dashboardService.getOrderStatusStats());
    }

    @GetMapping("/top-products/last7days")
    public Map<String,Object> topProductsLast7Days(
            @RequestParam(defaultValue = "4") int limit) {
        return Map.of("topProducts", dashboardService.getTopProductsLast7Days(limit));
    }

}
