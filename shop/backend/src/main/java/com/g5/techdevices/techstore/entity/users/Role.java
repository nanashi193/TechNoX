package com.g5.techdevices.techstore.entity.users;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "Name", nullable = false, length = 30)
    private String name;

    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<User> users;

    public static String ADMIN = "ADMIN";
    public static String CUSTOMER = "CUSTOMER";
    public static String OWNER = "OWNER";
    public static String STAFF = "STAFF";
    public static String SHIPPING_STAFF = "SHIPPING_STAFF";
}

