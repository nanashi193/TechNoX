package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PayTransactionRepository extends JpaRepository<PayTransaction, Long> {
    Optional<PayTransaction> findByOrderCode(Long orderCode);
    Optional<PayTransaction> findByBillId(Long billId);
    boolean existsByOrderCode(Long orderCode);
    Optional<PayTransaction> findFirstByBillIdOrderByCreatedAtDesc(Long billId);

    //-------------------------------------------------------
    @Query(value = """
        SELECT *
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER(PARTITION BY BillId ORDER BY CreatedAt DESC) as rn
            FROM dbo.PayTransaction
            WHERE BillId IN (:billIds) 
        ) AS ranked_transactions
        WHERE rn = 1
    """, nativeQuery = true)
    List<PayTransaction> findLatestStatusForBillIds(@Param("billIds") List<Long> billIds);
    //-------------------------------------------------------
}
