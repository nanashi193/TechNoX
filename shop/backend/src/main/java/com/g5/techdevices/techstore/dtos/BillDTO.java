package com.g5.techdevices.techstore.dtos;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class BillDTO {
    @JsonProperty("UserId")
    @Min(value = 1, message = "User's ID must be >0")
    private int userId;
    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("Email")
    private String email;

    @JsonProperty("Phone")
    @Size(min = 9, message = "Phone number at least 9 numbers")
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @JsonProperty("ShippingAdress")
    @NotBlank(message = "Shipping adress is required.")
    private String shippingAdress;

    @JsonProperty("Total")
    @Min(value = 0, message = "Total money must be >= 0")
    private BigDecimal total;

    @JsonProperty("PaymentMethod")
    private String paymentMethod;
}
