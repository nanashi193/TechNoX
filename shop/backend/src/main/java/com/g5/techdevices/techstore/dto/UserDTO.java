package com.g5.techdevices.techstore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.apache.logging.log4j.message.Message;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserDTO {
    @NotBlank(message = "Name is required")
    @JsonProperty("FullName")
    private String fullName;

    @NotBlank(message = "Email is required.")
    private String email;

    @Size(min = 8, message = "Password at least 8 characters.")
    @NotBlank(message = "Password can not be blank.")
    private String password;

    @JsonProperty("RepeatPassword")
    private String repeatPassword;

    @JsonProperty("Gender")
    private String gender;

    @NotBlank(message = "Phone number is required.")
    @JsonProperty("PhoneNumber")
    private String phoneNumber;

    @JsonProperty("IsActive")
    private boolean active;

    @JsonProperty("FacebookAccountId")
    private String facebookAccountId;

    @JsonProperty("GoogleAccountId")
    private String googleAccountId;

    @JsonProperty("RoleId")
    private long roleId =3L;
}
