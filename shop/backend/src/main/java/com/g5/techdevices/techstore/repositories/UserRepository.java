package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndPassword(String email, String password);

    @Query(value = """
      SELECT COUNT(*)
      FROM [Users] u
      WHERE u.[CreatedAt] >= :start AND u.[CreatedAt] < :end
        AND u.[RoleId] = 4  -- Giả sử RoleId=4 là CUSTOMER
      """, nativeQuery = true)
    Long countNewCustomersBetween(@Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);
    Page<User> findAll(Pageable pageable);
    List<User> findAllByRole_Name(String roleName);
    Optional<User> findStaffById(int id);
}


