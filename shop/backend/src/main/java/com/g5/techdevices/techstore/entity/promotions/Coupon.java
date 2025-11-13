package com.g5.techdevices.techstore.entity.promotions;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "Coupon")
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "Code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "Description", columnDefinition = "nvarchar(255)")
    private String description;

    @Column(name = "DiscountPercent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "DiscountAmount", precision = 18, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "MinOrderAmount", precision = 18, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "MaxDiscountAmount", precision = 18, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "StartDate")
    private LocalDate startDate;

    @Column(name = "EndDate")
    private LocalDate endDate;

    @Column(name = "MaxUsage")
    private Integer maxUsage;

    @Column(name = "UsageCount")
    private Integer usageCount;

    @Column(name = "IsActive")
    private Boolean isActive;
}
