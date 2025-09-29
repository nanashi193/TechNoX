package com.g5.techdevices.techstore.entity.users;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.review.Review;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserId")
    private Long id;

    @Column(name = "FullName", nullable = false, columnDefinition = "nvarchar(200)")
    private String fullName;

    @Column(name = "Email", nullable = false, unique = true, columnDefinition = "nvarchar(255)")
    private String email;

    @Column(name = "PasswordHash", nullable = false, columnDefinition = "nvarchar(512)")
    private String passwordHash;

    @Column(name = "Gender")
    private Boolean gender;

    @Column(name = "PhoneNumber", length = 50)
    private String phoneNumber;

    @Column(name = "Role", length = 50)
    private String role;

    @Column(name = "IsActive")
    private Boolean isActive;

    @OneToMany(mappedBy = "user")
    private List<Bill> bills;

    @OneToOne(mappedBy = "user")
    private Cart cart;

    @OneToMany(mappedBy = "user")
    private List<Review> reviews;

    @OneToMany(mappedBy = "user")
    private List<RecentView> recentViews;
}

