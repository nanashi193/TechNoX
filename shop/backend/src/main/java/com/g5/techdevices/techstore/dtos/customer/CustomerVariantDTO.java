package com.g5.techdevices.techstore.dtos.customer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CustomerVariantDTO {
    Long variantId;
    private String sku;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer quantity;
}
