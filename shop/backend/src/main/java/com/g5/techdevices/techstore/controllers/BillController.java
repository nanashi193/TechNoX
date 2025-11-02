package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.exceptions.InvalidOperationException;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.cart.ProductVariantRepository;
import com.g5.techdevices.techstore.responses.BillResponse;
import com.g5.techdevices.techstore.services.BillService;
import com.g5.techdevices.techstore.services.PayTransactionService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;
    private final PayOS payOS;               // bean từ PayOSConfig
    private final PayTransactionService payTransactionService;
    private final BillRepository billRepository;
    private static final Logger logger = LoggerFactory.getLogger(BillService.class);
    private  final ProductVariantRepository productVariantRepository;

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
    private User getCurrentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }

    // ============= 1) Tạo link thanh toán cho 1 bill =============
    @PostMapping("/{billId}/pay")
    public ResponseEntity<?> createPaymentLink(@PathVariable Long billId) throws Exception {
        // 1. Lấy thông tin bill và tổng tiền
        billService.assertExists(billId); // Kiểm tra bill có tồn tại
        BigDecimal total = billService.getBillTotal(billId);
        long amount = total.longValue(); // PayOS dùng long
        long orderCode = Instant.now().toEpochMilli(); // Mã đơn hàng unique

        // 2. LƯU VÀO DB (Gọi hàm mới 'createPending')
        payTransactionService.createPending(billId, total, orderCode);

        // 3. Tạo link PayOS
        String returnUrl = "http://localhost:4200/payment/success?billId=" + billId;
        String cancelUrl = "http://localhost:4200/payment/cancel?billId=" + billId;

        CreatePaymentLinkRequest req = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount)
                .description("Thanh toán đơn " + billId)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
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
            // 1. Xác thực webhook
            var data = payOS.webhooks().verify(rawBody);

            long   orderCode = data.getOrderCode();
            String code      = data.getCode(); // "00", "07", "09", ...

            // Hàm này đã bao gồm cả việc cập nhật Bill chính (qua billService.updateStatus)
            payTransactionService.updateFromWebhook(
                    orderCode,
                    code,
                    rawBody
            );

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Ghi log lỗi
            // e.printStackTrace();
            return ResponseEntity.ok().build();
        }
    }

    @GetMapping("/pay/webhook")
    public ResponseEntity<String> verifyWebhook() {
        return ResponseEntity.ok("Webhook endpoint active.");
    }
    // ============= 3) Xem trạng thái theo billId (tiện test) =============
    @GetMapping("/{billId}/pay/status")
    public ResponseEntity<?> getBillPayStatus(@PathVariable Long billId) {
        Optional<PayTransaction> txOpt = payTransactionService.findByBillId(billId);

        if (txOpt.isEmpty()) {
            // Nếu chưa có giao dịch, coi như là PENDING (hoặc NOT_FOUND)
            return ResponseEntity.ok(Map.of("billId", billId, "status", "PENDING"));
        }
        PayTransaction tx = txOpt.get();
        return ResponseEntity.ok(Map.of(
                "billId", tx.getBillId(),
                "orderCode", tx.getOrderCode(),
                "amount", tx.getAmount(),
                "status", tx.getStatus()
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

    @PostMapping()
    public ResponseEntity<?> createBill(
            @Valid @RequestBody BillCreateRequestDTO billDTO,
            BindingResult result
    ) {
        if (result.hasErrors()){
            List<String> errorMessages = result.getFieldErrors().stream()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .toList();
            return ResponseEntity.badRequest().body(errorMessages);
        }
        try {
            Bill createdBill = billService.createBill(billDTO);
            BillResponse responseDTO = new BillResponse();
            responseDTO.setBillId(createdBill.getId());
            responseDTO.setUserId(createdBill.getUser().getId());
            responseDTO.setFullName(createdBill.getFullName());
            responseDTO.setPhoneNumber(createdBill.getPhone());
            responseDTO.setShippingAddress(createdBill.getShippingAddress());
            responseDTO.setTotal(createdBill.getTotal());
            responseDTO.setPaymentMethod(createdBill.getPaymentMethod());
            responseDTO.setStatus(createdBill.getStatus());

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);

        } catch (DataNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (InsufficientStockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @PostMapping("/{billId}/confirm-cod")
    public ResponseEntity<?> confirmCOD(@PathVariable Long billId,
                                        Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            // SỬA SERVICE ĐỂ NHẬN USER
            BillResponse confirmedBillDTO = billService.confirmCOD(billId, currentUser);
            return ResponseEntity.ok(confirmedBillDTO);
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (InvalidOperationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (InsufficientStockException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }
}
