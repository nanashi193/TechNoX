package com.g5.techdevices.techstore.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class BillCreateRequestDTO {

    @NotBlank(message = "Full name is required.")
    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("Email")
    private String email;

    @NotBlank(message = "Phone number is required.")
    @JsonProperty("Phone")
    @Size(min = 9, message = "Phone number at least 9 numbers")
    private String phone;

    @NotBlank(message = "Shipping address is required.")
    @JsonProperty("ShippingAddress")
    private String shippingAddress;


    @NotEmpty(message = "Order details cannot be empty.")
    @JsonProperty("details")
    @Valid
    private List<BillDetailRequestDTO> details;
}