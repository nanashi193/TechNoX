package com.g5.techdevices.techstore.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill,Long> {
    List<Bill> findByUserId(Integer userId);
    Page<Bill> findByUser_Id(Integer userId, Pageable pageable);
    /**
     * Đếm tổng số đơn hàng của một user
     */
    @Query("SELECT COUNT(b) FROM Bill b WHERE b.user.id = :userId")
    int countOrdersByUserId(@Param("userId") Integer userId);

    /**
     * Tính tổng số tiền đã chi tiêu của một user
     */
    @Query("SELECT SUM(b.total) FROM Bill b WHERE b.user.id = :userId")
    Double sumTotalSpentByUserId(@Param("userId") Integer userId);

    // tổng tiền 1 day
    @Query(value = """
      SELECT COALESCE(SUM(b.[Total]), 0)
      FROM [Bill] b
      WHERE b.[OrderDate] >= :start AND b.[OrderDate] < :end
        AND b.[Status] IN ('Succeed','Confirmed')
      """, nativeQuery = true)
    BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start,
                                 @Param("end")   LocalDateTime end);

    // Đếm đơn: chỉ loại trừ Cancelled
    @Query(value = """
      SELECT COUNT(*)
      FROM [Bill] b
      WHERE b.[OrderDate] >= :start AND b.[OrderDate] < :end
        AND b.[Status] <> 'Cancelled'
      """, nativeQuery = true)
    Long countOrdersBetweenExcludingCancelled(@Param("start") LocalDateTime start,
                                              @Param("end")   LocalDateTime end);

    @Query(value = """
    SELECT b.[Status] AS status, COUNT(*) AS total
    FROM [Bill] b
    GROUP BY b.[Status]
    """, nativeQuery = true)
    List<Map<String, Object>> countOrdersByStatus();


    Optional<User> findById(int id);
    List<Bill> findByStaffIdAndStatusIn(int staffId, List<String> statuses, Sort sort);

}
