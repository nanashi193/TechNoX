package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.UserDTO;
import com.g5.techdevices.techstore.dtos.UserDetailDTO;
import com.g5.techdevices.techstore.dtos.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IUserService {
    User createUser(UserDTO userDTO) throws DataNotFoundException;

    void deleteUser(Long id);

    void restoreUser(Long id) throws DataNotFoundException;
    String login(String email, String password) throws Exception;
    User toggleActive(Long id, boolean isActive) throws DataNotFoundException;
    Page<User> getAllUsers(Pageable pageable) throws DataNotFoundException;

    User getUserById(Long id) throws DataNotFoundException;

    User updateUser(Long id, UserUpdateDTO userDTO) throws DataNotFoundException;
    User findUserByEmail(String email) throws DataNotFoundException;
    UserDetailDTO getUserDetailsByEmail(String email);
    UserDetailDTO updateUserDetails(String email, UserDetailDTO userUpdateDTO) throws DataNotFoundException;
}
