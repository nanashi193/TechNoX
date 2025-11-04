package com.g5.techdevices.techstore.responses.AdminBillsResponse;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BillDetailProductResponse {
    private Long productId;
    private Long variantId;
    private String productName;
    private String model;
    private String color;
    private int quantity;
    private BigDecimal unitPrice;
}
