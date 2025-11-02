package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.components.BillMapper;
import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.dtos.BillDetailRequestDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.exceptions.InvalidOperationException;
import com.g5.techdevices.techstore.repositories.BillDetailRepository;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.repositories.cart.ProductVariantRepository;
import com.g5.techdevices.techstore.responses.BillResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BillService implements IBillService {

    private final BillRepository billRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BillMapper billMapper;

    private static final Logger logger = LoggerFactory.getLogger(BillService.class);

    public BillService(BillRepository billRepository, BillDetailRepository billDetailRepository,
                       ProductVariantRepository variantRepository, UserRepository userRepository, EmailService emailService,
                       BillMapper billMapper) {
        this.billRepository = billRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.billMapper = billMapper;
    }
    // ================== CREATE BILL ==================
    @Override
    @Transactional
    public Bill createBill(BillCreateRequestDTO billDTO)
            throws DataNotFoundException, InsufficientStockException {

        // 1) Lấy user hiện tại
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new DataNotFoundException("Current user not found."));

        // 2) Tạo Bill
        Bill newBill = new Bill();
        newBill.setUser(currentUser);
        newBill.setFullName(billDTO.getFullName());
        newBill.setEmail(billDTO.getEmail() != null ? billDTO.getEmail() : currentUser.getEmail());
        newBill.setPhone(billDTO.getPhone());
        newBill.setShippingAddress(billDTO.getShippingAddress());
        newBill.setOrderDate(LocalDateTime.now());
        newBill.setPaymentMethod("COD");
        newBill.setStatus("Processing");
        newBill.setIsActive(true);

        // 3) Xử lý chi tiết & tính tổng
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<BillDetail> detailsList = new ArrayList<>();

        for (BillDetailRequestDTO detailDTO : billDTO.getDetails()) {
            ProductVariant variant = variantRepository.findById(detailDTO.getVariantId())
                    .orElseThrow(() -> new DataNotFoundException(
                            "Product Variant not found with id: " + detailDTO.getVariantId()
                    ));

            if (variant.getQuantity() < detailDTO.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for variant: " + variant.getId()
                                + " - " + variant.getProduct().getName()
                );
            }

            BillDetail detail = new BillDetail();
            detail.setBill(newBill);
            detail.setProduct(variant.getProduct());
            detail.setVariant(variant);
            detail.setQuantity(detailDTO.getQuantity());

            BigDecimal unitPrice = (variant.getPrice() != null
                    && variant.getPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? variant.getPrice()
                    : variant.getProduct().getPrice();

            detail.setUnitPrice(unitPrice);
            detail.setColor(variant.getColor());
            detail.setModel(variant.getSize());

            detailsList.add(detail);

            totalAmount = totalAmount.add(
                    unitPrice.multiply(BigDecimal.valueOf(detailDTO.getQuantity()))
            );
        }

        newBill.setTotal(totalAmount);
        newBill.setDetails(detailsList);

        Bill savedBill = billRepository.save(newBill);
        return savedBill;
    }

    // ================== (Các method interface — placeholder) ==================
    @Override
    public BillResponse getBill(long id) { return null; }

    @Override
    public BillResponse updateBill(long id, BillDTO billDTO) throws DataNotFoundException { return null; }

    @Override
    public void deleteBill(long id) { }

    @Override
    public List<BillResponse> findById(long userId) { return List.of(); }

    // ================== Helper dùng cho PayOS flow ==================

    /** Lấy tổng tiền của bill từ DB (fallback 0 nếu null). */
    public BigDecimal getBillTotal(Long billId) throws DataNotFoundException {
        Bill b = billRepository.findById(billId)
                .orElseThrow(() -> new DataNotFoundException("Bill not found: " + billId));
        return Optional.ofNullable(b.getTotal()).orElse(BigDecimal.ZERO);
    }

    /** Ném lỗi nếu bill không tồn tại. */
    public void assertExists(Long billId) throws DataNotFoundException {
        if (!billRepository.existsById(billId)) {
            throw new DataNotFoundException("Bill not found: " + billId);
        }
    }

    /** Cập nhật trạng thái Bill sau webhook (map từ trạng thái cổng thanh toán). */
    @Transactional
    public void updateStatus(Long billId, String gatewayStatus) throws DataNotFoundException {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new DataNotFoundException("Bill not found: " + billId));

        // Map “PAID”/“CANCELLED” từ PayOS -> trạng thái trong hệ thống
        String newStatus = switch (gatewayStatus) {
            case "PAID"      -> "Paid";
            case "CANCELLED" -> "Cancelled";
            default          -> bill.getStatus(); // giữ nguyên nếu không nhận diện
        };

        bill.setStatus(newStatus);
        billRepository.save(bill);
    }

    @Transactional
    public BillResponse confirmCOD(Long billId, User currentUser) throws DataNotFoundException, InvalidOperationException, InsufficientStockException {
        Bill confirmedBill = this.confirmBillLogic(billId, "COD", false);
        if (confirmedBill.getUser().getId() != (currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận đơn hàng này.");
        }
        return billMapper.mapToBillResponse(confirmedBill);
    }

    @Transactional
    public Bill confirmPayOSPayment(Long billId) throws DataNotFoundException, InvalidOperationException, InsufficientStockException {
        return this.confirmBillLogic(billId, "PayOS", true);
    }
    private Bill confirmBillLogic(Long billId, String paymentMethod, boolean allowIdempotentConfirm)
            throws DataNotFoundException, InvalidOperationException, InsufficientStockException {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new DataNotFoundException("Bill not found with id: " + billId));
        if (!"Processing".equals(bill.getStatus())) {
            if (allowIdempotentConfirm && "Confirmed".equals(bill.getStatus())) {
                logger.warn("Bill {} đã ở trạng thái Confirmed. Bỏ qua (idempotency).", billId);
                return bill;
            }
            throw new InvalidOperationException("Bill is not in 'Processing' state.");
        }
        bill.setStatus("Confirmed");
        if ("PayOS".equals(paymentMethod)) {
            bill.setPaymentMethod("PayOS");
        }
        this.deductStock(bill);
        this.sendConfirmationEmail(bill, paymentMethod);

        // 5. Lưu lại bill (trong cùng 1 transaction)
        return billRepository.save(bill);
    }

    private void deductStock(Bill bill) throws InsufficientStockException, DataNotFoundException {
        // Cần tải lại details nếu chúng là LAZY loading
        List<BillDetail> details = bill.getDetails();

        // Đoạn code này rất quan trọng nếu bạn dùng LAZY loading
        if (details == null || details.isEmpty()) {
            logger.warn("Bill details list is empty or null for Bill ID: {}. Stock not deducted.", bill.getId());
            return;
        }

        for (BillDetail detail : details) {
            ProductVariant variant = detail.getVariant();
            if (variant == null) {
                logger.warn("Variant is null for BillDetail ID: {}. Skipping stock deduction.", detail.getId());
                continue;
            }
            ProductVariant variantFromDb = variantRepository.findById(variant.getId())
                    .orElseThrow(() -> new DataNotFoundException("Variant not found during stock deduction: " + variant.getId()));

            int requestedQuantity = detail.getQuantity();

            if (variantFromDb.getQuantity() < requestedQuantity) {
                throw new InsufficientStockException(
                        "Insufficient stock (Final check) for variant: " + variantFromDb.getId()
                );
            }

            variantFromDb.setQuantity(variantFromDb.getQuantity() - requestedQuantity);
            variantRepository.save(variantFromDb);
        }
    }
    private void sendConfirmationEmail(Bill bill, String paymentMethod) {
        // TODO: Implement logic gửi email (ví dụ: gọi emailService.send...)
        logger.info("Đang gửi email xác nhận cho Bill ID: {} (Thanh toán: {})", bill.getId(), paymentMethod);
         emailService.sendOrderConfirmationEmail(bill);
    }
}
