package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.exceptions.DataNotFoundException;

public interface ISecurityUserService {
    String createPasswordResetToken(String email) throws DataNotFoundException;
}
