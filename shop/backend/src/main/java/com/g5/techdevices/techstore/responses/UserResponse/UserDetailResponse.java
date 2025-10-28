package com.g5.techdevices.techstore.responses.UserResponse;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.dtos.AddressDTO;
import com.g5.techdevices.techstore.entity.users.Address;
import com.g5.techdevices.techstore.entity.users.User;
import lombok.*;

import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDetailResponse {
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

    @JsonProperty("roleName")
    private String roleName;

    @JsonProperty("CreateAt")
    private String createAt;

    @JsonProperty("stats") //
    private UserStatsResponse stats;

    @JsonProperty("shippingAddress")
    private AddressDTO shippingAddress;

    public UserDetailResponse(User user, int ordersCount, double totalSpent) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phoneNumber = user.getPhoneNumber();
        this.isActive = user.getIsActive();
        this.roleName = user.getRole().getName();
        this.createAt = user.getCreatedAt().toString();

        this.stats = new UserStatsResponse(ordersCount, totalSpent);
        if (user.getAddress() != null) {
            Address entity = user.getAddress();
            this.shippingAddress = AddressDTO.builder()
                    .addressId(entity.getAddressId())
                    .line1(entity.getLine1())
                    .line2(entity.getLine2())
                    .district(entity.getDistrict())
                    .city(entity.getCity())
                    .province(entity.getProvince())
                    .zipCode(entity.getZipCode())
                    .build();
        } else {
            this.shippingAddress = null;
        }
    }
}
