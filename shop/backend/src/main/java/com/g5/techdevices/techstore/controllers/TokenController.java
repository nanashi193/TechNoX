package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.responses.GenericResponse;
import com.g5.techdevices.techstore.services.ITokenService;
import com.g5.techdevices.techstore.services.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
public class TokenController {
    private final IUserService userService;
    private final ITokenService tokenService;
    private final UserRepository userRepository;

    @GetMapping("/verify-email")
    public ResponseEntity<GenericResponse> verifyAccount(@RequestParam("token") String token) {
        User user = tokenService.verifyTokenAndGetUser(token);
        user.setEmailVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok(new GenericResponse("Email verified successfully!"));
    }
}
