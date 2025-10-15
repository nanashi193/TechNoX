package com.g5.techdevices.techstore.responses;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class BillResponse {
    @JsonProperty("UserId")
    private int userId;

    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("Phone")
    private String phoneNumber;

    @JsonProperty("ShippingAdress")
    private String shippingAdress;

    @JsonProperty("Total")
    private BigDecimal total;

    @JsonProperty("PaymentMethod")
    private String paymentMethod;
}
