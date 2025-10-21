package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill,Long> {
    List<Bill> findByUserId(Integer userId);
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
}
