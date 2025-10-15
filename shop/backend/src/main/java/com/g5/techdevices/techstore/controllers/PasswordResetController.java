package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.responses.GenericResponse;
import com.g5.techdevices.techstore.services.ISecurityUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
public class PasswordResetController {
    private final Environment env;
    private final JavaMailSender mailSender;
    private final ISecurityUserService securityUserService;

    @PostMapping("/resetPassword")
    public GenericResponse resetPassword(@RequestParam("email") String userEmail) {
        try {
            String token = securityUserService.createPasswordResetToken(userEmail);
            mailSender.send(securityUserService.buildResetPasswordEmail(token, userEmail, env));
            return new GenericResponse("Reset password email has been sent");
        } catch (Exception e) {
            e.printStackTrace();
            return new GenericResponse("Exception: " + e.getMessage());
        }
    }
}
