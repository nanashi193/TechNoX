package com.g5.techdevices.techstore.entity.users;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.review.Review;
import com.g5.techdevices.techstore.entity.tokens.Token;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Builder
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@ToString(onlyExplicitlyIncluded = true)
@Table(name = "Users")
public class User implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_"+getRole().getName().toUpperCase()));
//        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserId")
    private int id;

    @Column(name = "FullName", nullable = false, columnDefinition = "nvarchar(200)")
    private String fullName;

    @Column(name = "Email", nullable = false, unique = true, columnDefinition = "nvarchar(255)")
    private String email;

    @Column(name = "Password", nullable = false, columnDefinition = "nvarchar(512)")
    private String password;

    @Column(name = "Gender")
    private Boolean gender;

    @Column(name = "PhoneNumber", length = 50, nullable = false)
    private String phoneNumber;

    @Column(name = "IsActive")
    private Boolean isActive;

    @Column(name = "FacebookAccountId", length = 100)
    private String facebookAccountId;

    @Column(name = "GoogleAccountId", length = 100)
    private String googleAccountId;

    @Column(name = "EmailVerified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "CreatedAt")
    private String createAt;

    @ManyToOne
    @JoinColumn(name = "RoleId", nullable = false)
    @ToString.Exclude
    @JsonIgnoreProperties("users")
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Token> tokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SocialAccount> socialAccounts;

    @OneToMany(mappedBy = "user")
    private List<Bill> bills;

    @OneToOne(mappedBy = "user")
    private Cart cart;

    @OneToMany(mappedBy = "user")
    private List<Review> reviews;

    @OneToMany(mappedBy = "user")
    private List<RecentView> recentViews;

    @ManyToOne
    @ToString.Exclude
    @JsonIgnoreProperties("users")
    @JoinColumn(name = "AddressId")
    private Address address;
}

