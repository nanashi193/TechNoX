package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.tokens.EmailType;
import com.g5.techdevices.techstore.entity.tokens.Token;
import com.g5.techdevices.techstore.entity.tokens.TokenType;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class TokenService implements ITokenService {
    private final EmailService emailService;
    private final TokenRepository tokenRepository;

    @Override
    public String createVeificationToken(User user) throws DataNotFoundException {
        tokenRepository.deleteAllByUserAndTokenType(user, TokenType.REGISTER);
        Token token = Token.builder()
                .token(UUID.randomUUID().toString())
                .tokenType(TokenType.REGISTER)
                .expirationDate(LocalDateTime.now().plusMinutes(30))
                .user(user)
                .build();
        tokenRepository.save(token);
        return token.getToken();
    }

    @Override
    public User verifyTokenAndGetUser(String tokenStr) {
        Token token = tokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        if (token.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }
        return token.getUser();
    }
}
