package com.g5.techdevices.techstore.entity.tokens;


import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PasswordResetToken {

    private static final int EXPIRATION = 60 * 24; // 24h

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;

    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(name = "UserId", nullable = false)
    private User user;

    @Column(name = "ExpireDate")
    private Date expireDate;

    public PasswordResetToken(String token, User user) {
        this.token = token;
        this.user = user;
        this.expireDate = calculateExpiryDate(EXPIRATION);
    }

    private Date calculateExpiryDate(int expiryTimeInMinutes) {
        return new Date(System.currentTimeMillis() + (expiryTimeInMinutes * 60L * 1000L));
    }
}
