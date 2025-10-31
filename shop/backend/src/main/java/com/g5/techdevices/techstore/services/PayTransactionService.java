package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.repositories.PayTransactionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PayTransactionService {
    private final PayTransactionRepo repo;
    private final BillService billService; // đã có trong dự án của bạn

    public PayTransaction createPending(Long billId, BigDecimal amount, long orderCode) {
        PayTransaction tx = new PayTransaction();
        tx.setOrderCode(orderCode);
        tx.setBillId(billId);
        tx.setAmount(amount);
        tx.setStatus("PENDING");
        return repo.save(tx);
    }

    public void updateFromWebhook(long orderCode, String payCode, String rawBody) {
        var tx = repo.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalStateException("Unknown orderCode: " + orderCode));

        if ("PAID".equals(tx.getStatus()) || "CANCELLED".equals(tx.getStatus())) return; // idempotent

        tx.setPayCode(payCode);
        tx.setStatus(switch (payCode) {
            case "00" -> "PAID";
            case "07", "09" -> "CANCELLED";
            default -> "UNKNOWN";
        });
        tx.setRawWebhook(rawBody);
        repo.save(tx);

        billService.updateStatus(tx.getBillId(), tx.getStatus()); // đồng bộ sang Bill
    }
}
