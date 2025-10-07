package com.g5.techdevices.techstore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class BillDetailDTO {
    @Min(value = 1, message = "Bill detail's ID must be >0")
    @JsonProperty("BillDetailId")
    private Integer billDetailId;

    @JsonProperty("ProductId")
    private Integer productId;

    @JsonProperty("VariantId")
    private Integer variantId;
    @Min(value = 1, message = "Quantity must be >0")
    @JsonProperty("Quantity")
    private Integer quantity;

    @JsonProperty("UnitPrice")
    private BigDecimal unitPrice;

    @JsonProperty("Model")
    private String model;

    @JsonProperty("Color")
    private String color;

}
