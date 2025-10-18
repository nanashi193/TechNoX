package com.g5.techdevices.techstore.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailDTO {
    private int id;
    @NotBlank(message = "Name is required")
    @JsonProperty("FullName")
    private String fullName;
    @NotBlank(message = "Email is required.")
    private String email;
    @NotBlank(message = "Phone number is required.")
    @JsonProperty("PhoneNumber")
    private String phoneNumber;
    @JsonProperty("IsActive")
    private Boolean isActive;
    @JsonProperty("CreateAt")
    private String createAt;

    private String roleName;

    private AddressDTO address;

}
