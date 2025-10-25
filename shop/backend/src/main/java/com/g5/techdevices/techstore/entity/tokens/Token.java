package com.g5.techdevices.techstore.entity.tokens;

import com.g5.techdevices.techstore.entity.users.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Tokens")
public class Token {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(nullable = false, length = 50)
    private TokenType tokenType;

    private LocalDateTime expirationDate;

    @Column(nullable = false)
    private boolean revoked;

    @Column(nullable = false)
    private boolean expire;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expirationDate);
    }
    @ManyToOne
    @JoinColumn(name = "UserId")
    private User user;

}
