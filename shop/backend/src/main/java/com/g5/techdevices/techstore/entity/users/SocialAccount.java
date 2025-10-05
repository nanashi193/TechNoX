package com.g5.techdevices.techstore.entity.users;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "SocialAccount")
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false, length = 50)
    private String providerId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    // Many SocialAccounts belong to 1 User
    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

    // getters & setters
}