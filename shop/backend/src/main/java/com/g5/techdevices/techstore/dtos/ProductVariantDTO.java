package com.g5.techdevices.techstore.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariantDTO {
    private Long id;
    @NotBlank(message = "Color is required")
    private String color;

    @NotBlank(message = "Size is required")
    private String size;

    @Min(value = 0, message = "Quantity must be >= 0")
    private Integer quantity;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be >= 0")
    private BigDecimal price;

    private String sku; // có thể để null để service tự generate
}
