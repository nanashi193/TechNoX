package com.g5.techdevices.techstore.entity.users;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AddressID")
    private Integer addressId;

    @Column(name = "Line1", nullable = false, length = 255)
    private String line1;

    @Column(name = "Line2", length = 255)
    private String line2;

    @Column(name = "District", length = 100)
    private String district;

    @Column(name = "City", length = 100)
    private String city;

    @Column(name = "Province", length = 100)
    private String province;

    @Column(name = "ZipCode", length = 20)
    private String zipCode;

    @OneToMany(mappedBy = "address")
    private java.util.List<User> users;
}
