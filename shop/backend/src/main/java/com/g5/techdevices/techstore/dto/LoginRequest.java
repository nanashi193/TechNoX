package com.g5.techdevices.techstore.dto;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class LoginRequest
{
    private String email;
    private String password;
}
