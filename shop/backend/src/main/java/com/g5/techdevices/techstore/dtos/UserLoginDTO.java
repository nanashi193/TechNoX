package com.g5.techdevices.techstore.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserLoginDTO {
    @NotBlank(message = "User's email is required.")
    private String email;

    @NotBlank(message = "Password can not be blank.")
    private String password;
}
