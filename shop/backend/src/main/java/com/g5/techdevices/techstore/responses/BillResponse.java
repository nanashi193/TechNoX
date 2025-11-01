package com.g5.techdevices.techstore.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class BillResponse {
    @JsonProperty("BillId")
    private int billId;

    @JsonProperty("UserId")
    private int userId;

    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("Phone")
    private String phoneNumber;

    @JsonProperty("ShippingAddress")
    private String shippingAddress;

    private String status;

    @JsonProperty("Total")
    private BigDecimal total;

    @JsonProperty("PaymentMethod")
    private String paymentMethod;
}
