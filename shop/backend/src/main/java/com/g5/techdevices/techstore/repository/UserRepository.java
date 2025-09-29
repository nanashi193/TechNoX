package com.g5.techdevices.techstore.repository;

import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndPasswordHash(String email, String passwordHash);
}


