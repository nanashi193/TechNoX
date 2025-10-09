package com.g5.techdevices.techstore.Services;

import com.g5.techdevices.techstore.components.JwtTokenUtil;
import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.RoleRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;

    @Override
    public User createUser(UserDTO userDTO) throws DataNotFoundException {
        String email = userDTO.getEmail();
        if(userRepository.existsByEmail(email)){
            throw new DataIntegrityViolationException("Email already exists");
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
        Role role = roleRepository.findById(3L)
                .orElseThrow(() ->  new DataNotFoundException("Role is not found."));
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
    public String login(String email, String password) throws Exception {
        Optional<User> optionalUser =  userRepository.findByEmail(email);
        if(optionalUser.isEmpty()){
            throw new DataNotFoundException("Invalid enmail/password");
        }
        User existingUser = optionalUser.get();
        if(existingUser.getFacebookAccountId() == null &&
                existingUser.getGoogleAccountId() == null){
            if(!passwordEncoder.matches(password, existingUser.getPassword())){
                 throw new BadCredentialsException("Invalid email or password");
            }
        }
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        email, password,
                        existingUser.getAuthorities());
        authenticationManager.authenticate(authenticationToken);
        return jwtTokenUtil.generateToken(existingUser);
    }

}
