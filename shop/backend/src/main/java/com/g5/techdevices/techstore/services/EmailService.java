package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.tokens.EmailType;
import lombok.AllArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final Environment env;

    public void sendEmail(String to, EmailType type, String token) {
        String subject;
        String body;
        System.out.println("Send email to: " + to + " with token: " + token);
        switch (type) {
            case VERIFY_ACCOUNT -> {
                subject = "Verify your account";
                body = "Please click the link to verify your account:\n" +
                        "http://localhost:4200/verify-email?token=" + token;
            }
            case RESET_PASSWORD -> {
                subject = "Reset Password";
                body = "Click below to reset your password:\n" +
                        "http://localhost:4200/reset-password?token=" + token;
            }
            default -> throw new IllegalArgumentException("Unknown email type");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(env.getProperty("support.email", "noreply@example.com"));
        mailSender.send(message);
    }
}
