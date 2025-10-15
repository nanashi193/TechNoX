package com.g5.techdevices.techstore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {
    @NotEmpty(message = "Full name is required.")
    @JsonProperty("FullName")
    private String fullName;

    @JsonProperty("PhoneNumber")
    private String phoneNumber;

    @JsonProperty("isActive")
    private Boolean isActive;
}
