package com.g5.techdevices.techstore.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BillDetailRequestDTO {

    @NotNull(message = "Variant ID is required.")
    @JsonProperty("variantId")
    private Long variantId;

    @NotNull(message = "Quantity is required.")
    @Min(value = 1, message = "Quantity must be at least 1.")
    @JsonProperty("quantity")
    private Integer quantity;
}
