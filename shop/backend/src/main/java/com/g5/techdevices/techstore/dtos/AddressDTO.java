package com.g5.techdevices.techstore.dtos;

import lombok.*;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {
    private Integer addressId;
    private String line1;
    private String line2;
    private String district;
    private String city;
    private String province;
    private String zipCode;
}