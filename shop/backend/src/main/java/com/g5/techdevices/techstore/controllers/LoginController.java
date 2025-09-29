package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dto.LoginRequest;
import com.g5.techdevices.techstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmailAndPasswordHash(request.getEmail(), request.getPassword())
                .map(user -> {
                    if (Boolean.TRUE.equals(user.getIsActive())) {
                        return ResponseEntity.ok(Map.of(
                                "status", "success",
                                "message", "Login successful",
                                "role", user.getRole()
                        ));
                    } else {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                "status", "fail",
                                "message", "Account is inactive"
                        ));
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "status", "fail",
                        "message", "Invalid email or password"
                )));

    }
}