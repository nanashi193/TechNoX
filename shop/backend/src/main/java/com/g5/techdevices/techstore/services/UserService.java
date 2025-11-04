package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.components.JwtTokenUtil;
import com.g5.techdevices.techstore.components.UserMapper;
import com.g5.techdevices.techstore.dtos.AddressDTO;
import com.g5.techdevices.techstore.dtos.UserDTO;
import com.g5.techdevices.techstore.dtos.UserDetailDTO;
import com.g5.techdevices.techstore.dtos.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.staff.StaffInfo;
import com.g5.techdevices.techstore.entity.tokens.EmailType;
import com.g5.techdevices.techstore.entity.tokens.PasswordResetToken;
import com.g5.techdevices.techstore.entity.users.Address;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InvalidTokenException;
import com.g5.techdevices.techstore.exceptions.PermissionDenyException;
import com.g5.techdevices.techstore.repositories.PasswordTokenRepository;
import com.g5.techdevices.techstore.repositories.RoleRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.repositories.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserMapper userMapper;
    private final PasswordTokenRepository  passwordTokenRepository;
    private final EmailService emailService;

    /**
     * Helper method: Lấy thông tin User đang đăng nhập từ SecurityContext.
     * @return User entity của người dùng hiện tại
     * @throws DataNotFoundException nếu không tìm thấy user
     */
    private User getCurrentAuthenticatedUser() throws DataNotFoundException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new DataNotFoundException("Current authenticated user not found."));
    }

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
    public Page<User> getAllUsers(Pageable pageable) throws DataNotFoundException {
        // Lấy user đang đăng nhập hiện tại
        User currentUser = getCurrentAuthenticatedUser();

        boolean isAdmin = currentUser.getRole().getName().equalsIgnoreCase(Role.ADMIN);
        boolean isOwner = currentUser.getRole().getName().equalsIgnoreCase(Role.OWNER);

        if (!(isAdmin || isOwner)) {
            throw new AccessDeniedException("You don't have permission to get list user.");
        }
        return userRepository.findAll(pageable);
    }
    @Override
    public User getUserById(Long id) throws DataNotFoundException {
        User currentUser = getCurrentAuthenticatedUser();

        boolean isAdmin = currentUser.getRole().getName().equalsIgnoreCase(Role.ADMIN);
        boolean isOwner = currentUser.getRole().getName().equalsIgnoreCase(Role.OWNER);
        boolean isSelf = currentUser.getId() == (id);

        if (!(isAdmin || isOwner || isSelf)) {
            throw new AccessDeniedException("You don't have permission to view this user.");
        }

        return userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Cannot find user with id: " + id));
    }
    @Override
    public User updateUser(Long id, UserUpdateDTO userDTO) throws DataNotFoundException {
        User existingUser = userRepository.findById(id).orElseThrow(() ->
                new DataNotFoundException("Can not find User with id:" +id));
        // Lấy user đang đăng nhập hiện tại
        User currentUser = getCurrentAuthenticatedUser();

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
    //Nut gat xoa mem user
    @Override
    public User toggleActive(Long id, boolean isActive) throws DataNotFoundException {
        User currentUser = getCurrentAuthenticatedUser();
        boolean isAdmin = currentUser.getRole().getName().equalsIgnoreCase(Role.ADMIN);
        boolean isOwner = currentUser.getRole().getName().equalsIgnoreCase(Role.OWNER);

        if (!(isAdmin || isOwner)) {
            throw new AccessDeniedException("You don't have permission to update this user.");
        }
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Cannot find user with id: " + id));

        existingUser.setIsActive(isActive);
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
    public UserDetailDTO getUserDetailsByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return userMapper.toUserDetailDTO(user);
    }

    @Override
    @Transactional
    public UserDetailDTO updateUserDetails(String email, UserDetailDTO userUpdateDTO) throws DataNotFoundException {
        User user = findUserByEmail(email);
        user.setFullName(userUpdateDTO.getFullName());
        user.setPhoneNumber(userUpdateDTO.getPhoneNumber());
//        user.setIsActive(userUpdateDTO.getIsActive());
        if (userUpdateDTO.getAddress() != null) {
            AddressDTO addressDTO = userUpdateDTO.getAddress();
            Address addressEntity;
            if (user.getAddress() != null) {
                addressEntity = user.getAddress();
            } else {
                addressEntity = new Address();
            }
            addressEntity.setLine1(addressDTO.getLine1());
            addressEntity.setLine2(addressDTO.getLine2());
            addressEntity.setDistrict(addressDTO.getDistrict());
            addressEntity.setCity(addressDTO.getCity());
            addressEntity.setProvince(addressDTO.getProvince());
            addressEntity.setZipCode(addressDTO.getZipCode());

            Address savedAddress = addressRepository.save(addressEntity);
            user.setAddress(savedAddress);

        } else {
            if (user.getAddress() != null) {
                Address oldAddress = user.getAddress();
                user.setAddress(null);
                // addressRepository.delete(oldAddress);
            }
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toUserDetailDTO(updatedUser);
    }

    @Override
    public String createPasswordResetToken(String email) throws DataNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User not found"));

        List<PasswordResetToken> oldTokens = passwordTokenRepository.findByUserAndExpireDateAfter(user, new Date());
        oldTokens.forEach(passwordTokenRepository::delete);

        String token = UUID.randomUUID().toString();
        PasswordResetToken newToken = new PasswordResetToken(token, user);
        passwordTokenRepository.save(newToken);
        emailService.sendEmail(user.getEmail(), EmailType.RESET_PASSWORD, token);
        return token;
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword)
            throws DataNotFoundException, InvalidTokenException {
        //Tìm token trong DB
        PasswordResetToken resetToken = passwordTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired password reset token."));
        //Kiểm tra token còn hạn
        if (resetToken.getExpireDate().before(new Date())) {
            passwordTokenRepository.delete(resetToken); //Xóa token hết hạn
            throw new InvalidTokenException("Password reset token has expired.");
        }
        //Lấy User từ token
        User user = resetToken.getUser();
        if (user == null) {
            throw new DataNotFoundException("User associated with the token not found.");
        }
        //Hash mật khẩu mới
        String password = passwordEncoder.encode(newPassword);
        //Cập nhật mật khẩu cho User
        user.setPassword(password);
        userRepository.save(user);
        //Xóa token đã sử dụng
        passwordTokenRepository.delete(resetToken);
    }
    @Override
    public List<StaffInfo> getStaffList() {
        List<User> staffUsers = userRepository.findAllByRole_Name(Role.STAFF);
        return staffUsers.stream()
                .map(user -> new StaffInfo(user.getId(), user.getFullName(), user.getPhoneNumber()))
                .collect(Collectors.toList());
    }
}

