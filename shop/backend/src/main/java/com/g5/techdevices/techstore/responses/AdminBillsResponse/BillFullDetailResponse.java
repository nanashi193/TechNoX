package com.g5.techdevices.techstore.responses.AdminBillsResponse;

import com.g5.techdevices.techstore.entity.staff.StaffInfo;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BillFullDetailResponse {
    private Long billId;
    private LocalDateTime orderDate;
    private String status;
    private BigDecimal total;
    private String paymentMethod;

    private String customerFullName;
    private String customerPhone;
    private String shippingAddress;

    private String paymentStatus;

    private StaffInfo staff;

    private List<BillDetailProductResponse> products;
}
