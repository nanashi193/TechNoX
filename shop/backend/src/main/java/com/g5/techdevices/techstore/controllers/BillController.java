package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.services.BillService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("${api.prefix}/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;   // service của bạn
    private final PayOS payOS;               // bean từ PayOSConfig

    /** Store tạm để test (prod hãy cập nhật DB thật) */
    private final ConcurrentHashMap<Long, Tx> txStore = new ConcurrentHashMap<>(); // key = orderCode

    @Data @Builder @AllArgsConstructor
    static class Tx {
        Long billId;
        long orderCode;
        long amount;
        String status;     // PENDING | PAID | CANCELLED | UNKNOWN
        String webhookRaw; // raw payload cuối cùng
    }

    // ============= 1) Tạo link thanh toán cho 1 bill =============
    @PostMapping("/{billId}/pay")
    public ResponseEntity<?> createPaymentLink(@PathVariable Long billId) throws Exception {
        // đảm bảo bill tồn tại (ném lỗi nếu không có)
        billService.assertExists(billId);

        // lấy tổng tiền từ DB qua service (đÃ tính trong createBill)
        BigDecimal total = billService.getBillTotal(billId);
        long amount = total.longValue(); // PayOS nhận long (VND)

        // orderCode unique (bạn có thể thay bằng sequence DB)
        long orderCode = Instant.now().toEpochMilli();

        // lưu trạng thái tạm
        txStore.put(orderCode, Tx.builder()
                .billId(billId)
                .orderCode(orderCode)
                .amount(amount)
                .status("PENDING")
                .build());

        // gọi PayOS SDK v2 để tạo link
        CreatePaymentLinkRequest req = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description("Thanh toán đơn " + billId)
                .returnUrl("http://localhost:4200/checkout/success") // sửa theo FE
                .cancelUrl("http://localhost:4200/checkout/cancel")  // sửa theo FE
                .build();

        CreatePaymentLinkResponse res = payOS.paymentRequests().create(req);

        return ResponseEntity.ok(Map.of(
                "billId", billId,
                "orderCode", orderCode,
                "amount", amount,
                "checkoutUrl", res.getCheckoutUrl()
        ));
    }

    // ============= 2) Webhook PayOS (MỞ PUBLIC trong WebSecurityConfig) =============
    // .requestMatchers(POST, apiPrefix + "/bills/pay/webhook").permitAll()
    @PostMapping("/pay/webhook")
    public ResponseEntity<Void> handlePayOSWebhook(@RequestBody String rawBody) {
        try {
            // KHÔNG import WebhookData nữa. SDK v2 trả object có sẵn các getter.
            var data = payOS.webhooks().verify(rawBody);

            long   orderCode = data.getOrderCode(); // OK với SDK v2
            String code      = data.getCode();      // "00", "07", "09", ...

            String status = switch (code) {
                case "00"        -> "PAID";
                case "07", "09"  -> "CANCELLED";
                default          -> "UNKNOWN";
            };

            Tx tx = txStore.get(orderCode);
            if (tx != null) {
                tx.setStatus(status);
                tx.setWebhookRaw(rawBody);
                // TODO: cập nhật DB thực tế nếu cần, ví dụ:
                // if ("PAID".equals(status)) billService.markPaid(tx.getBillId());
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // sai chữ ký/format -> 400
            return ResponseEntity.badRequest().build();
        }
    }

    // ============= 3) Xem trạng thái theo billId (tiện test) =============
    @GetMapping("/{billId}/pay/status")
    public ResponseEntity<?> getBillPayStatus(@PathVariable Long billId) {
        Optional<Tx> txOpt = txStore.values().stream()
                .filter(t -> t.getBillId().equals(billId))
                .findFirst();

        if (txOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("billId", billId, "status", "NOT_FOUND"));
        }
        Tx t = txOpt.get();
        return ResponseEntity.ok(Map.of(
                "billId", t.getBillId(),
                "orderCode", t.getOrderCode(),
                "amount", t.getAmount(),
                "status", t.getStatus()
        ));
    }

    // ============= 4) Xem trạng thái theo orderCode (tiện test) =============
    @GetMapping("/pay/resolve")
    public ResponseEntity<?> resolveByOrderCode(@RequestParam long orderCode) {
        Tx t = txStore.get(orderCode);
        if (t == null) {
            return ResponseEntity.ok(Map.of("orderCode", orderCode, "status", "NOT_FOUND"));
        }
        return ResponseEntity.ok(Map.of(
                "billId", t.getBillId(),
                "orderCode", t.getOrderCode(),
                "amount", t.getAmount(),
                "status", t.getStatus()
        ));
    }
}
