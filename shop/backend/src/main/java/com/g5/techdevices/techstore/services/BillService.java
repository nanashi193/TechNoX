package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.dtos.BillDetailRequestDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.repositories.BillDetailRepository;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.repositories.cart.ProductVariantRepository;
import com.g5.techdevices.techstore.responses.BillResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
@RequiredArgsConstructor
public class BillService implements IBillService {

    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final Logger logger = LoggerFactory.getLogger(BillService.class);

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

            variant.setQuantity(variant.getQuantity() - detailDTO.getQuantity());
            variantRepository.save(variant);
        }

        newBill.setTotal(totalAmount);
        newBill.setDetails(detailsList);

        Bill savedBill = billRepository.save(newBill);

        try {
            emailService.sendOrderConfirmationEmail(savedBill);
        } catch (Exception e) {
            logger.error("Failed to send order confirmation email for Bill ID: {}", savedBill.getId(), e);
        }

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
}
