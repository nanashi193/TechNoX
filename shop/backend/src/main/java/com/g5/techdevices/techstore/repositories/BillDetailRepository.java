package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillDetailRepository extends JpaRepository<BillDetail, Long> {
    List<BillDetail> findByBillId(Long billId);
}
