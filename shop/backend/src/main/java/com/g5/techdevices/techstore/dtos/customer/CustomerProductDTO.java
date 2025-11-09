package com.g5.techdevices.techstore.dtos.customer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Data
public class CustomerProductDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private List<String> imageUrls;
    private String description;
    private String categoryName;
    private boolean inStock;
    private List<CustomerVariantDTO> variants;
}
