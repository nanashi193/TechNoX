package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.components.JwtTokenUtil;
import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.dto.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.users.PasswordResetToken;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.PermissionDenyException;
import com.g5.techdevices.techstore.repositories.RoleRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.repositories.PasswordTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

<<<<<<< HEAD
import java.util.UUID;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
=======
import java.util.*;
>>>>>>> origin/develop

@Service
@RequiredArgsConstructor
public class UserService implements IUserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final PasswordTokenRepository passwordTokenRepository;

    @Override
    public User createUser(UserDTO userDTO) throws DataNotFoundException {
        String email = userDTO.getEmail();
        if(userRepository.existsByEmail(email)){
            throw new DataIntegrityViolationException("Email already exists");
        }
        Role role = roleRepository.findById(userDTO.getRoleId())
                .orElseThrow(() ->  new DataNotFoundException("Role is not found."));
        if(role.getName().toUpperCase().equals(Role.ADMIN)){
            throw new PermissionDenyException("You can not register an admin account.");
        }
        boolean genderValue = "Nam".equalsIgnoreCase(userDTO.getGender());
        User newUser = User.builder()
                .fullName(userDTO.getFullName())
                .email(userDTO.getEmail())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .phoneNumber(userDTO.getPhoneNumber())
                .gender(genderValue)

                .isActive(true)
                .facebookAccountId(userDTO.getFacebookAccountId()
                        != null ? userDTO.getFacebookAccountId() : "0")
                .googleAccountId(userDTO.getGoogleAccountId()
                        !=null ? userDTO.getGoogleAccountId() : "0")
                .build();
        newUser.setRole(role);
        //Kiểm tra nếu có accountId thì ko yêu cầu mât khẩu
        if(userDTO.getFacebookAccountId() == null && userDTO.getGoogleAccountId() == null) {
            String password = userDTO.getPassword();
            //Se lam trong phan Spring Security
            String encodedPassword = passwordEncoder.encode(password);
            newUser.setPassword(encodedPassword);
        }
        return userRepository.save(newUser);

    }

    @Override
    public List<User> getAllUsers() throws DataNotFoundException {
        // Lấy user đang đăng nhập hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new DataNotFoundException("Current user not found."));

        boolean isAdmin = currentUser.getRole().getName().equalsIgnoreCase(Role.ADMIN);
        boolean isOwner = currentUser.getRole().getName().equalsIgnoreCase(Role.OWNER);

        if (!(isAdmin || isOwner)) {
            throw new AccessDeniedException("You don't have permission to get list user.");
        }
        return userRepository.findAll();
    }

    @Override
    public User updateUser(Long id, UserUpdateDTO userDTO) throws DataNotFoundException {
        User existingUser = userRepository.findById(id).orElseThrow(() ->
                new DataNotFoundException("Can not find User with id:" +id));
        // Lấy user đang đăng nhập hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new DataNotFoundException("Current user not found."));

        boolean isAdmin = currentUser.getRole().getName().equalsIgnoreCase(Role.ADMIN);
        boolean isOwner = currentUser.getRole().getName().equalsIgnoreCase(Role.OWNER);
        boolean isSelf = Objects.equals(currentUser.getId(), existingUser.getId());

        if (!(isAdmin || isOwner || isSelf)) {
            throw new AccessDeniedException("You don't have permission to update this user.");
        }
        existingUser.setFullName(userDTO.getFullName());
        existingUser.setPhoneNumber(userDTO.getPhoneNumber());

        return userRepository.save(existingUser);
    }
    @Override
    public void deleteUser(Long id){
        User user = userRepository.findById(id).orElse(null);
        if(user != null){
            //Xoa mem
            user.setIsActive(false);
            userRepository.save(user);
        }
    }
    @Override
    public void restoreUser(Long id) throws DataNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("User not found"));
        user.setIsActive(true);
        userRepository.save(user);
    }


    @Override
    public String login(String email, String password) throws Exception {
        Optional<User> optionalUser =  userRepository.findByEmail(email);
        if(optionalUser.isEmpty()){
            throw new DataNotFoundException("Invalid email/password");
        }
        User existingUser = optionalUser.get();
        if(existingUser.getFacebookAccountId() == null &&
                existingUser.getGoogleAccountId() == null){
            if(!passwordEncoder.matches(password, existingUser.getPassword())){
                 throw new BadCredentialsException("Invalid email or password");
            }
        }
        try {
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(
                            email, password,
                            existingUser.getAuthorities());
            authenticationManager.authenticate(authenticationToken);
        }catch (BadCredentialsException e){
            throw new BadCredentialsException("Invalid email or password");
        }
        return jwtTokenUtil.generateToken(existingUser);
    }
    @Override
    public User findUserByEmail(String email) throws DataNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User with email " + email + " not found"));
    }

    @Override
    public String generatePasswordResetToken(User user) {
        List<PasswordResetToken> existingToken = passwordTokenRepository
                .findByUserAndExpireDateAfter(user, new Date());
        String token;
        if (!existingToken.isEmpty()) {
            token = existingToken.get(0).getToken();
        } else {
            token = UUID.randomUUID().toString();
            createPasswordResetTokenForUser(user, token);
        }
        return token;
    }
    @Override
    public void createPasswordResetTokenForUser(User user, String token) {
        PasswordResetToken myToken = new PasswordResetToken(token, user);
        passwordTokenRepository.save(myToken);
    }

    @Override
    public String resendVerification(String email) throws DataNotFoundException {
        User user = findUserByEmail(email);
        if (user.isEmailVerified()) {
            return null; // Email đã được xác minh
        }
        
        String token = UUID.randomUUID().toString();
        // TODO: Gửi email với link xác minh
        // Trong quá trình phát triển, trả về token để frontend tự xử lý
        return token;
    }

    @Override
    public void verifyEmail(String token) throws DataNotFoundException {
        // TODO: Validate token từ email verification
        // Trong quá trình phát triển, chấp nhận mọi token
        // Trong production cần lưu và validate token, có thể dùng VerificationToken tương tự PasswordResetToken
        User user = userRepository.findById(1L).orElseThrow(() -> new DataNotFoundException("User not found"));
        user.setEmailVerified(true);
        userRepository.save(user);
    }
}
