package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.responses.GenericResponse;
import com.g5.techdevices.techstore.services.ISecurityUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<GenericResponse> resetPassword(@RequestParam("email") String userEmail) {
        try {
            String token = securityUserService.createPasswordResetToken(userEmail);
            return ResponseEntity.ok(new GenericResponse("Reset password email has been sent to " + userEmail));
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new GenericResponse("User not found with email: " + userEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new GenericResponse("Error: " + e.getMessage()));
        }
    }
}
