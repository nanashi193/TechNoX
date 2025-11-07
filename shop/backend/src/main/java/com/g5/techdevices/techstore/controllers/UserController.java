package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.*;
import com.g5.techdevices.techstore.dtos.resetPassword.ForgotPasswordDTO;
import com.g5.techdevices.techstore.dtos.resetPassword.ResetPasswordDTO;
import com.g5.techdevices.techstore.entity.staff.StaffInfo;
import com.g5.techdevices.techstore.entity.tokens.EmailType;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InvalidTokenException;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.responses.UserResponse.UserDetailResponse;
import com.g5.techdevices.techstore.responses.UserResponse.UserListResponse;
import com.g5.techdevices.techstore.responses.UserResponse.UserPageResponse;
import com.g5.techdevices.techstore.services.EmailService;
import com.g5.techdevices.techstore.services.ITokenService;
import com.g5.techdevices.techstore.services.IUserService;
import com.g5.techdevices.techstore.entity.users.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

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
    private BillRepository billRepository;

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
    public ResponseEntity<UserPageResponse<UserListResponse>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "name_asc") String sort
    ) throws DataNotFoundException {
        boolean sortByRealNameAsc  = "name_asc".equalsIgnoreCase(sort);
        boolean sortByRealNameDesc = "name_desc".equalsIgnoreCase(sort);
        boolean sortByOrdersAsc    = "orders_asc".equalsIgnoreCase(sort);
        boolean sortByOrdersDesc   = "orders_desc".equalsIgnoreCase(sort);
        boolean sortByTotalAsc     = "totalSpent_asc".equalsIgnoreCase(sort);
        boolean sortByTotalDesc    = "totalSpent_desc".equalsIgnoreCase(sort);

        Page<User> userPage;
        if (sortByRealNameAsc || sortByRealNameDesc) {
            // ✅ GIỮ NGUYÊN: sort theo “tên thật” (chữ cuối) bằng Java trong service
            userPage = userService.getAllUsersSortByRealName(sortByRealNameAsc, page, limit);
        } else if (sortByOrdersAsc || sortByOrdersDesc || sortByTotalAsc || sortByTotalDesc) {
            // ✅ MỚI: sort theo tổng đơn / tổng tiền ở DB (đúng phân trang)
            Pageable pageable = PageRequest.of(page - 1, limit);
            userPage = userRepository.findUsersOrderByAggregate(sort.toLowerCase(), pageable);
        } else {
            // ✅ Fallback: sort theo trường entity (nếu cần)
            Pageable pageable = PageRequest.of(page - 1, limit);
            userPage = userService.getAllUsers(pageable);
        }
        List<UserListResponse> userResponses = userPage.getContent().stream()
                .map(user -> {
                    int orders = billRepository.countOrdersByUserId(user.getId());
                    Double total = billRepository.sumTotalSpentByUserId(user.getId());
                    return new UserListResponse(user, orders, (total != null) ? total : 0.0);
                })
                .collect(Collectors.toList());
        UserPageResponse<UserListResponse> response = new UserPageResponse<>();
        response.setItems(userResponses);
        response.setTotal(userPage.getTotalElements());
        return ResponseEntity.ok(response);

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
    //Lay user bang id
    @GetMapping("/{id}")
    public ResponseEntity<UserDetailResponse> getUserById(
            @PathVariable("id") Long id
    ) throws DataNotFoundException {

        User existingUser = userService.getUserById(id);

        int orders = billRepository.countOrdersByUserId(existingUser.getId());
        Double total = billRepository.sumTotalSpentByUserId(existingUser.getId());
        UserDetailResponse userDetailResponse = new UserDetailResponse(
                existingUser,
                orders,
                (total != null) ? total : 0.0
        );

        return ResponseEntity.ok(userDetailResponse);
    }
    //Nut gat xoa mem
    @PatchMapping("/{id}/active")
    public ResponseEntity<UserListResponse> toggleUserActive(
            @PathVariable("id") Long id,
            @RequestBody ActiveToggleDTO dto
    ) throws DataNotFoundException {
        User updatedUser = userService.toggleActive(id, dto.isActive());

        int orders = billRepository.countOrdersByUserId(updatedUser.getId());
        Double total = billRepository.sumTotalSpentByUserId(updatedUser.getId());
        UserListResponse responseDTO = new UserListResponse(
                updatedUser,
                orders,
                (total != null) ? total : 0.0
        );

        return ResponseEntity.ok(responseDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
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

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordDTO dto
    ) {
        try {
            String userEmail = dto.getEmail();
            userService.createPasswordResetToken(userEmail);
            return ResponseEntity.ok("Reset password email has been sent to " + userEmail);
        } catch (DataNotFoundException e) {
            return ResponseEntity.ok("If your email exists in our system, a password reset link has been sent.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordDTO resetPasswordDTO) {
        try {
            userService.resetPassword(resetPasswordDTO.getToken(), resetPasswordDTO.getNewPassword());
            return ResponseEntity.ok("Password has been reset successfully.");
        } catch (InvalidTokenException e) { //
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (DataNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while resetting the password.");
        }
    }

    @GetMapping("/staff")
    public ResponseEntity<List<StaffInfo>> getStaffList() {
        List<StaffInfo> staffList = userService.getStaffList();
        return ResponseEntity.ok(staffList);
    }
}
