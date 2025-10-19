package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.UserDetailDTO;
import com.g5.techdevices.techstore.dtos.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.tokens.EmailType;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.services.EmailService;
import com.g5.techdevices.techstore.services.ITokenService;
import com.g5.techdevices.techstore.services.IUserService;
import com.g5.techdevices.techstore.dtos.UserDTO;
import com.g5.techdevices.techstore.dtos.UserLoginDTO;
import com.g5.techdevices.techstore.entity.users.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;
    private final ITokenService tokenService;
    private final EmailService emailService;
    private final UserRepository userRepository;

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
            String token = tokenService.createVeificationToken(user);
            emailService.sendEmail(user.getEmail(), EmailType.VERIFY_ACCOUNT, token);
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
    @GetMapping("/me")
    public ResponseEntity<UserDetailDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        UserDetailDTO userDTO = userService.getUserDetailsByEmail(currentEmail);
        return ResponseEntity.ok(userDTO);
    }
    //Cap nhat quyen admin
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
    //Cap nhat quyen User
    @PutMapping("/me")
    public ResponseEntity<UserDetailDTO> updateCurrentUser(
            @RequestBody UserDetailDTO userUpdateDTO, // Nhận DTO từ frontend
            Authentication authentication) throws DataNotFoundException {

        String currentEmail = authentication.getName();
        UserDetailDTO updatedUser = userService.updateUserDetails(currentEmail, userUpdateDTO);
        return ResponseEntity.ok(updatedUser);
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
}
