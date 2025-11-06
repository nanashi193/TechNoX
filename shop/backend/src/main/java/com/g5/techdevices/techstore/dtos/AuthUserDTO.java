package com.g5.techdevices.techstore.dtos;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthUserDTO {
    private Long id; // Users.UserId
    private String name; // Users.FullName
    private String email; // Users.Email
    private String role; // OWNER | ADMIN | STAFF | CUSTOMER
    private String avatar; // nếu chưa có thì để null
}
