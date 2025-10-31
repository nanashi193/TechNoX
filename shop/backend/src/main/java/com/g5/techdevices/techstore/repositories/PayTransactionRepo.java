package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayTransactionRepo extends JpaRepository<PayTransaction, Long> {
    Optional<PayTransaction> findByOrderCode(Long orderCode);
    Optional<PayTransaction> findByBillId(Long billId);
    boolean existsByOrderCode(Long orderCode);
}
