package com.g5.techdevices.techstore.dtos;

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
