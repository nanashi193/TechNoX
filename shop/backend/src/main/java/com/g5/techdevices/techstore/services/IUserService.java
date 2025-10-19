package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.UserDTO;
import com.g5.techdevices.techstore.dtos.UserDetailDTO;
import com.g5.techdevices.techstore.dtos.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;

import java.util.List;

public interface IUserService {
    User createUser(UserDTO userDTO) throws DataNotFoundException;

    void deleteUser(Long id);

    void restoreUser(Long id) throws DataNotFoundException;
    String login(String email, String password) throws Exception;
    List<User> getAllUsers() throws DataNotFoundException;
    User updateUser(Long id, UserUpdateDTO userDTO) throws DataNotFoundException;
    User findUserByEmail(String email) throws DataNotFoundException;
    UserDetailDTO getUserDetailsByEmail(String email);
    UserDetailDTO updateUserDetails(String email, UserDetailDTO userUpdateDTO) throws DataNotFoundException;
}
