package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.repositories.PayTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayTransactionService {
    private final PayTransactionRepository payTransactionRepository;
    private final BillService billService; // đã có trong dự án của bạn

    @Transactional
    public PayTransaction createPending(Long billId, BigDecimal amount, long orderCode) {
        PayTransaction tx = PayTransaction.builder()
                .orderCode(orderCode)
                .billId(billId)
                .amount(amount)
                .status("PENDING")
                .build();
        return payTransactionRepository.save(tx);
    }

    @Transactional
    public void updateFromWebhook(long orderCode, String payCode, String rawBody) {
        var tx = payTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalStateException("Unknown orderCode: " + orderCode));

        // Kiểm tra Idempotent (nếu đã xử lý thì bỏ qua)
        if ("PAID".equals(tx.getStatus()) || "CANCELLED".equals(tx.getStatus())) {
            return;
        }

        // Cập nhật trạng thái
        tx.setPayCode(payCode);
        tx.setStatus(switch (payCode) {
            case "00" -> "PAID";
            case "07", "09" -> "CANCELLED";
            default -> "UNKNOWN";
        });
        tx.setRawWebhook(rawBody);
        payTransactionRepository.save(tx);

        // ĐỒNG BỘ TRẠNG THÁI SANG BẢNG BILL CHÍNH
        // Giả sử BillService có hàm 'updateStatus(billId, status)'
        billService.updateStatus(tx.getBillId(), tx.getStatus());
    }

    public Optional<PayTransaction> findByOrderCode(long orderCode) {
        return payTransactionRepository.findByOrderCode(orderCode);
    }

    // 4. Dùng cho API check (debug)
    public Optional<PayTransaction> findByBillId(long billId) {
        return payTransactionRepository.findByBillId(billId);
    }
}
