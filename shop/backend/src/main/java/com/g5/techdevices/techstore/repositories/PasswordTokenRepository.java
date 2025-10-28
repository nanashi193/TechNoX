package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.tokens.PasswordResetToken;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    List<PasswordResetToken> findByUserAndExpireDateAfter(User user, Date now);
    Optional<PasswordResetToken> findByToken(String token);
}
