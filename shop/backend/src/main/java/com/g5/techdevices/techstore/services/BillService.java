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
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService implements IBillService{

    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final ProductVariantRepository variantRepository; // <-- Tiêm repo variant
    private final UserRepository userRepository;
    private final EmailService emailService;
    private static final Logger logger = LoggerFactory.getLogger(BillService.class);
    @Override
    @Transactional
    public Bill createBill(BillCreateRequestDTO billDTO) throws DataNotFoundException, InsufficientStockException {
        //Lấy User đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new DataNotFoundException("Current user not found."));

        //Tạo đối tượng Bill
        Bill newBill = new Bill();
        newBill.setUser(currentUser);
        newBill.setFullName(billDTO.getFullName());
        newBill.setEmail(billDTO.getEmail() != null ? billDTO.getEmail() : currentUser.getEmail()); // Ưu tiên email DTO, fallback về email user
        newBill.setPhone(billDTO.getPhone());
        newBill.setShippingAddress(billDTO.getShippingAddress());
        newBill.setOrderDate(LocalDateTime.now());
        newBill.setPaymentMethod("COD"); // Set payment method
        newBill.setStatus("Processing"); // Hoặc "Paid" nếu thanh toán thành công ngay lập tức
        newBill.setIsActive(true); ;

        //Xử lý Bill Details và tính tổng tiền
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<BillDetail> detailsList = new ArrayList<>();

        for (BillDetailRequestDTO detailDTO : billDTO.getDetails()) {
            // Tìm ProductVariant
            ProductVariant variant = variantRepository.findById(detailDTO.getVariantId())
                    .orElseThrow(() -> new DataNotFoundException("Product Variant not found with id: " + detailDTO.getVariantId()));

            // Kiểm tra tồn kho
            if (variant.getQuantity() < detailDTO.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for variant: " + variant.getId() + " - " + variant.getProduct().getName());
            }

            // Tạo BillDetail
            BillDetail detail = new BillDetail();
            detail.setBill(newBill); // Liên kết với Bill vừa tạo
            detail.setProduct(variant.getProduct()); // Lấy Product từ Variant
            detail.setVariant(variant);
            detail.setQuantity(detailDTO.getQuantity());
            // Lấy giá bán (ưu tiên giá variant nếu có, nếu không lấy giá gốc product)
            BigDecimal unitPrice = (variant.getPrice() != null && variant.getPrice().compareTo(BigDecimal.ZERO) > 0)
                    ? variant.getPrice()
                    : variant.getProduct().getPrice();
            detail.setUnitPrice(unitPrice);
            // (Tùy chọn) Lưu snapshot màu sắc, size nếu cần
            detail.setColor(variant.getColor());
            detail.setModel(variant.getSize());

            detailsList.add(detail);

            //Cộng dồn tổng tiền
            totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(detailDTO.getQuantity())));

            //Giảm số lượng tồn kho
            variant.setQuantity(variant.getQuantity() - detailDTO.getQuantity());
            variantRepository.save(variant); // Cập nhật lại tồn kho
        }

        //Set tổng tiền và danh sách details cho Bill
        newBill.setTotal(totalAmount);
        newBill.setDetails(detailsList); // Gán list (Hibernate sẽ tự xử lý lưu details)

        //Lưu Bill (Cascade sẽ tự lưu details nếu cấu hình đúng trong Bill entity)
        Bill savedBill = billRepository.save(newBill);

        // (Tùy chọn: Xóa các item đã mua khỏi Cart của user)
        // cartService.removeItemsAfterOrder(currentUser.getId(), billDTO.getDetails().stream().map(BillDetailRequestDTO::getVariantId).toList());

        try {
            emailService.sendOrderConfirmationEmail(savedBill);
        } catch (Exception e) {
            logger.error("Failed to send order confirmation email for Bill ID: " + savedBill.getId(), e);
        }
        return savedBill;
    }

    @Override
    public BillResponse getBill(long id) {
        return null;
    }

    @Override
    public BillResponse updateBill(long id, BillDTO billDTO) throws DataNotFoundException {
        return null;
    }

    @Override
    public void deleteBill(long id) {

    }

    @Override
    public List<BillResponse> findById(long userId) {
        return List.of();
    }
}
