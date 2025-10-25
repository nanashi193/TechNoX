package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.tokens.Token;
import com.g5.techdevices.techstore.entity.tokens.TokenType;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Long> {
    Optional<Token> findByToken(String token);

    List<Token> findByUserAndTokenTypeAndExpirationDateAfter(
            User user,
            TokenType tokenType,
            LocalDateTime now
    );

    void deleteAllByUserAndTokenType(User user, TokenType tokenType);
}
