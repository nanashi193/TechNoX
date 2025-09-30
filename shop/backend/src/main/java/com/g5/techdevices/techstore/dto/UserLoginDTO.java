package com.g5.techdevices.techstore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserLoginDTO {
    @NotBlank(message = "Email is required.")
    private String email;

    @NotBlank(message = "Password can not be blank.")
    private String passwordHash;
}
