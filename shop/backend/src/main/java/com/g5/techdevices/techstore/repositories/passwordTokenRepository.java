package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.users.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface passwordTokenRepository extends JpaRepository<PasswordResetToken, Long> {
}
