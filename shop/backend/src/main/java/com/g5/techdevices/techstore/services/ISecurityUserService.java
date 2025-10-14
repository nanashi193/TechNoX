package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;

public interface ISecurityUserService {
    String createPasswordResetToken(String email) throws DataNotFoundException;

    SimpleMailMessage buildResetPasswordEmail(String token, String email, Environment env) throws DataNotFoundException;
}
