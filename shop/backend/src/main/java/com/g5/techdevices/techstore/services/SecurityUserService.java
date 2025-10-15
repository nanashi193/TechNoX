package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.tokens.EmailType;
import com.g5.techdevices.techstore.entity.tokens.PasswordResetToken;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.PasswordTokenRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.MessageSource;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecurityUserService implements ISecurityUserService {

    private final PasswordTokenRepository passwordTokenRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;
    private final EmailService emailService;

    @Override
    public String createPasswordResetToken(String email) throws DataNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User not found"));

        List<PasswordResetToken> oldTokens = passwordTokenRepository.findByUserAndExpireDateAfter(user, new Date());
        oldTokens.forEach(passwordTokenRepository::delete);

        String token = UUID.randomUUID().toString();
        PasswordResetToken newToken = new PasswordResetToken(token, user);
        passwordTokenRepository.save(newToken);
        emailService.sendEmail(user.getEmail(), EmailType.RESET_PASSWORD, token);
        return token;
    }
}
