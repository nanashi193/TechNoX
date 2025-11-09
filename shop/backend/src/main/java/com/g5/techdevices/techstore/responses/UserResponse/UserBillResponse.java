package com.g5.techdevices.techstore.responses.UserResponse;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class UserBillResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
}
