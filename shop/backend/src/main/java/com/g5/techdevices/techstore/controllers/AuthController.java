package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.AuthUserDTO;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;

    @GetMapping("/me")
    public AuthUserDTO me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");

        // Thường authentication.getName() là email từ JWT
        String email = authentication.getName();

        User u = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Ưu tiên lấy role từ authorities, fallback từ entity Role
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // "ROLE_OWNER"
                .findFirst().orElse(null);
        if (role != null && role.startsWith("ROLE_"))
            role = role.substring(5);
        if (role == null && u.getRole() != null)
            role = u.getRole().getName(); // cột Roles.Name

        return AuthUserDTO.builder()
                .id(Long.valueOf(u.getId()))
                .name(u.getFullName()) // map đúng getter của bạn
                .email(u.getEmail())
                .role(role)
                .avatar(null) // có field avatar thì map vào
                .build();
    }
}
