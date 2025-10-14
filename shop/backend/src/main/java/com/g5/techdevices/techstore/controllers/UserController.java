package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dto.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.products.Category;
import com.g5.techdevices.techstore.entity.users.PasswordResetToken;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.PasswordTokenRepository;
import com.g5.techdevices.techstore.responses.GenericResponse;
import com.g5.techdevices.techstore.services.IUserService;
import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.dto.UserLoginDTO;
import com.g5.techdevices.techstore.entity.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.SimpleMailMessage;

import java.util.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;
    private final Environment env;
    private final JavaMailSender mailSender;
    private final MessageSource messages;
    private final PasswordTokenRepository passwordTokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserDTO userDTO,
                                          BindingResult result) {
        try {
            if (result.hasErrors()){
                List<String> errorMassage = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                return ResponseEntity.badRequest().body(errorMassage);
            }
            if(!userDTO.getPassword().equals(userDTO.getRepeatPassword())){
                return ResponseEntity.badRequest().body("Passwords do not match");
            }
            User user = userService.createUser(userDTO);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    @GetMapping("")
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam("page") int page,
            @RequestParam("limit") int limit
    ) throws DataNotFoundException {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @Valid @RequestBody UserUpdateDTO userUpdateDTO) {
        try {
            User updatedUser = userService.updateUser(id, userUpdateDTO);
            return ResponseEntity.ok(Map.of(
                    "message", "User updated successfully",
                    "user", updatedUser
            ));
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@Valid @PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User has been deleted successfully");
    }
    @PutMapping("/restore/{id}")
    public ResponseEntity<?> restoreUser(@PathVariable Long id) {
        try {
            userService.restoreUser(id);
            return ResponseEntity.ok(Map.of("message", "User restored successfully"));
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @Valid @RequestBody UserLoginDTO userLoginDTO){
        try {
            String token = userService.login(userLoginDTO.getEmail(), userLoginDTO.getPassword());
            //Kiem tra thong tin dang nhap va sinh Token
            //Tra ve token trong response
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resetPassword")
    public GenericResponse resetPassword(HttpServletRequest request,
                                         @RequestParam("email") String userEmail) throws DataNotFoundException {
        try {
            User user = userService.findUserByEmail(userEmail);
            if (user == null) {
                return new GenericResponse("Cannot find user with email " + userEmail);
            }

            List<PasswordResetToken> existingTokens = passwordTokenRepository
                    .findByUserAndExpireDateAfter(user, new Date());
            existingTokens.forEach(passwordTokenRepository::delete); // xóa token cũ

            String token = UUID.randomUUID().toString();
            PasswordResetToken myToken = new PasswordResetToken(token, user);
            passwordTokenRepository.save(myToken);

            String url = "http://localhost:4200/reset-password?token=" + token;
            String message;
            try {
                message = messages.getMessage("message.resetPassword", null, request.getLocale());
            } catch (NoSuchMessageException e) {
                message = "Please click the link below to reset your password:";
            }

            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(user.getEmail());
            email.setSubject("Reset Password");
            email.setText(message + "\n" + url);
            email.setFrom(env.getProperty("support.email", "noreply@example.com"));

            try {
                mailSender.send(email);
            } catch (Exception e) {
                e.printStackTrace();
                return new GenericResponse("Mail send failed: " + e.getMessage());
            }
            return new GenericResponse("Reset password email has been sent");

        } catch (Exception e) {
            e.printStackTrace();
            return new GenericResponse("Exception: " + e.getMessage());
        }
    }
    private SimpleMailMessage constructResetTokenEmail(
            String contextPath, Locale locale, String token, User user) {
        String url = "http://localhost:4200/reset-password?token=" + token;
        String message = messages.getMessage("message.resetPassword",
                null, locale);
        return constructEmail("Reset Password", message + " \r\n" + url, user);
    }

    private SimpleMailMessage constructEmail(String subject, String body,
                                             User user) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setSubject(subject);
        email.setText(body);
        email.setTo(user.getEmail());
        email.setFrom(env.getProperty("support.email"));
        return email;
    }

    private String getAppUrl(HttpServletRequest request) {
        return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath();
    }
<<<<<<< HEAD
//    @PostMapping("/resend-verification")
//    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
//        String email = body.get("email");
//        // Gửi mail xác minh (hoặc phát hành lại token)
//        // (Dev) Có thể trả về token để FE tự mở verify:
//        String token = userService.resendVerification(email); // trả về token hoặc null
//        if (token != null) {
//            return ResponseEntity.ok(Map.of("message", "Sent", "token", token)); // FE sẽ tự /verify-email?token=...
//        }
//        return ResponseEntity.ok(Map.of("message", "Sent"));
//    }
//
//    @PostMapping("/verify-email")
//    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> body) {
//        String token = body.get("token");
//        userService.verifyEmail(token); // set emailVerified=true
//        return ResponseEntity.ok(Map.of("message", "Verified"));
//    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resend(@RequestBody EmailDTO body) throws DataNotFoundException {
        String token = userService.resendVerification(body.getEmail());
        if (token == null) {
            // user đã verified rồi → trả message rõ ràng
            return ResponseEntity.status(409).body(Map.of("message", "already-verified"));
        }
        return ResponseEntity.ok(Map.of("token", token)); // DEV: trả token để test
    }
//    @GetMapping("/verify-email")
//    public ResponseEntity<?> verify(@RequestParam String token) throws DataNotFoundException {
//        userService.verifyEmail(token);
//        return ResponseEntity.ok(Map.of("status","verified"));
//    }
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyByPost(@RequestBody Map<String,String> body)
            throws DataNotFoundException {
        String token = body.get("token");
        userService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("status","verified"));
    }

// Có thể đặt DTO làm inner class để gọn
@lombok.Data
static class EmailDTO {
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Email
    private String email;
=======
>>>>>>> origin/develop
}
}

