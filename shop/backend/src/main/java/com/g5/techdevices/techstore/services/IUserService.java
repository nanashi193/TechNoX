package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.dto.UserUpdateDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;

import java.util.List;

public interface IUserService {
    User createUser(UserDTO userDTO) throws DataNotFoundException;
    String login(String email, String password) throws Exception;
    List<User> getAllUsers() throws DataNotFoundException;
    User updateUser(Long id, UserUpdateDTO userDTO) throws DataNotFoundException;
}
