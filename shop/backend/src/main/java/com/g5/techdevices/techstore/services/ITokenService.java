package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;

public interface ITokenService {

    String createVeificationToken(User user) throws DataNotFoundException;

    User verifyTokenAndGetUser(String tokenStr);
}
