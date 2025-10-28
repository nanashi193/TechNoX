package com.g5.techdevices.techstore.responses.UserResponse;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.entity.users.User;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserListResponse {

    @JsonProperty("id")
    private long id;

    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("email")
    private String email;

    @JsonProperty("PhoneNumber")
    private String phoneNumber;

    @JsonProperty("IsActive")
    private boolean isActive;

    @JsonProperty("stats")
    private UserStatsResponse stats;
    public UserListResponse(User user, int ordersCount, double totalSpent) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.isActive = user.getIsActive();

        // Gán stats thật nhận từ Controller
        this.stats = new UserStatsResponse(ordersCount, totalSpent);
    }
}
