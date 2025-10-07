package com.g5.techdevices.techstore.Services;

import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.repositories.RoleRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    @Override
    public User createUser(UserDTO userDTO) throws DataNotFoundException {
        String email = userDTO.getEmail();
        if(userRepository.existsByEmail(email)){
            throw new DataIntegrityViolationException("Email already exists");
        }
        User newUser = User.builder()
                .fullName(userDTO.getFullName())
                .email(userDTO.getEmail())
                .gender(userDTO.isGender())
                .phoneNumber(userDTO.getPhoneNumber())
                .facebookAccountId(userDTO.getFacebookAccountId())
                .googleAccountId(userDTO.getGoogleAccountId())
                .build();
        Role role = roleRepository.findById(userDTO.getRoleId())
                .orElseThrow(() ->  new DataNotFoundException("Role is not found."));
        newUser.setRole(role);
        //Kiểm tra nếu có accountId thì ko yêu cầu mât khẩu
        if(userDTO.getFacebookAccountId() == null && userDTO.getGoogleAccountId() == null){
            String password = userDTO.getPassword;
            //Se lam trong phan Spring Security
//            String password = userDTO.getPassword();
//            String encodedPassword = passwordEncoder.encode(password);
            return userRepository.save(newUser);
        }
        return null;
    }

    @Override
    public String login(String email, String password) {
        return "";
    }
}
