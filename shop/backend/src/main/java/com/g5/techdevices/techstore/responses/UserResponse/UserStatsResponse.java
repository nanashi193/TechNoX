package com.g5.techdevices.techstore.responses.UserResponse;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserStatsResponse {
    @JsonProperty("orders")
    private int orders;

    @JsonProperty("totalSpent")
    private double totalSpent;
}
