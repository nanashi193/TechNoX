package com.g5.techdevices.techstore.Services;

import com.g5.techdevices.techstore.dto.UserDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;

public interface IUserService {
    User createUser(UserDTO userDTO) throws DataNotFoundException;
    String login(String email, String password);
}
