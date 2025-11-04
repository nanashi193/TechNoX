package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.repositories.PayTransactionRepository;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.exceptions.InvalidOperationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayTransactionService {
    private final PayTransactionRepository payTransactionRepository;
    private final BillService billService;

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

    /**
     * Hàm này được gọi bởi Webhook Controller.
     * Nó sẽ cập nhật PayTransaction VÀ gọi BillService để cập nhật Bill.
     */
    @Transactional
    public void updateFromWebhook(long orderCode, String payCode, String rawBody) {
        var tx = payTransactionRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> {
                    log.error("[Webhook] Không tìm thấy PayTransaction với orderCode: {}", orderCode);
                    return new IllegalStateException("Unknown orderCode: " + orderCode);
                });

        if ("PAID".equals(tx.getStatus()) || "CANCELLED".equals(tx.getStatus())) {
            log.warn("[Webhook] Giao dịch {} đã được xử lý. Bỏ qua.", orderCode);
            return;
        }

        String newTxStatus = switch (payCode) {
            case "00" -> "PAID";
            case "07", "09" -> "CANCELLED";
            default -> "UNKNOWN";
        };
        tx.setPayCode(payCode);
        tx.setStatus(newTxStatus);
        tx.setRawWebhook(rawBody);
        payTransactionRepository.save(tx);

        try {
            if ("PAID".equals(newTxStatus)) {
                log.info("[Webhook] Gọi confirmPayOSPayment cho Bill ID: {}", tx.getBillId());
                billService.confirmPayOSPayment((long) tx.getBillId());

            } else if ("CANCELLED".equals(newTxStatus)) {
                log.info("[Webhook] Gọi updateStatus(CANCELLED) cho Bill ID: {}", tx.getBillId());
                billService.updateStatus((long) tx.getBillId(), "CANCELLED");
            }

        } catch (DataNotFoundException | InvalidOperationException | InsufficientStockException e) {
            log.error("[Webhook] Lỗi nghiệp vụ khi xử lý Bill ID {}: {}", tx.getBillId(), e.getMessage());
            throw new RuntimeException("Lỗi nghiệp vụ khi cập nhật Bill từ webhook", e);
        } catch (Exception e) {
            log.error("[Webhook] Lỗi không mong muốn khi xử lý Bill ID {}: {}", tx.getBillId(), e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi cập nhật Bill từ webhook", e);
        }
    }

    public Optional<PayTransaction> findByOrderCode(long orderCode) {
        return payTransactionRepository.findByOrderCode(orderCode);
    }

    public Optional<PayTransaction> findByBillId(long billId) {
        return payTransactionRepository.findByBillId(billId);
    }
}
