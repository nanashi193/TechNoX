package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.users.PasswordResetToken;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.PasswordTokenRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.NoSuchMessageException;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.context.MessageSource;

import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SecurityUserService implements ISecurityUserService {

    private final PasswordTokenRepository passwordTokenRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    @Override
    public String createPasswordResetToken(String email) throws DataNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User not found"));

        List<PasswordResetToken> oldTokens = passwordTokenRepository.findByUserAndExpireDateAfter(user, new Date());
        oldTokens.forEach(passwordTokenRepository::delete);

        String token = UUID.randomUUID().toString();
        PasswordResetToken newToken = new PasswordResetToken(token, user);
        passwordTokenRepository.save(newToken);
        return token;
    }
    @Override
    public SimpleMailMessage buildResetPasswordEmail(String token, String email, Environment env) throws DataNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User not found"));

        String url = "http://localhost:4200/reset-password?token=" + token;
        String body;
        try {
            body = messageSource.getMessage("message.resetPassword", null, Locale.getDefault());
        } catch (NoSuchMessageException e) {
            body = "Please click the link below to reset your password:";
        }

        SimpleMailMessage emailMessage = new SimpleMailMessage();
        emailMessage.setTo(user.getEmail());
        emailMessage.setSubject("Reset Password");
        emailMessage.setText(body + "\n" + url);
        emailMessage.setFrom(env.getProperty("support.email", "noreply@example.com"));

        return emailMessage;
    }
}
