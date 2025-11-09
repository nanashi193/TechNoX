package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.components.BillAdminMapper;
import com.g5.techdevices.techstore.components.BillMapper;
import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.dtos.BillDetailRequestDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.entity.users.Role;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.exceptions.InvalidOperationException;
import com.g5.techdevices.techstore.repositories.BillDetailRepository;
import com.g5.techdevices.techstore.repositories.BillRepository;
import com.g5.techdevices.techstore.repositories.PayTransactionRepository;
import com.g5.techdevices.techstore.repositories.UserRepository;
import com.g5.techdevices.techstore.repositories.cart.ProductVariantRepository;
import com.g5.techdevices.techstore.responses.AdminBillsResponse.BillAdminResponse;
import com.g5.techdevices.techstore.responses.AdminBillsResponse.BillFullDetailResponse;
import com.g5.techdevices.techstore.responses.BillResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BillService implements IBillService {

    private final BillRepository billRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BillMapper billMapper;
    private final BillAdminMapper billAdminMapper;
    private final PayTransactionRepository payTransactionRepository;

    private static final Logger logger = LoggerFactory.getLogger(BillService.class);

    public BillService(BillRepository billRepository, BillDetailRepository billDetailRepository,
                       ProductVariantRepository variantRepository, UserRepository userRepository, EmailService emailService,
                       BillMapper billMapper,  BillAdminMapper billAdminMapper,
                       PayTransactionRepository payTransactionRepository) {
        this.billRepository = billRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.billMapper = billMapper;
        this.billAdminMapper = billAdminMapper;
        this.payTransactionRepository = payTransactionRepository;
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
        return billRepository.save(bill);
    }

    private void deductStock(Bill bill) throws InsufficientStockException, DataNotFoundException {
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

    public List<BillAdminResponse> getBillsForAdmin() {
        List<Bill> bills = billRepository.findAll(Sort.by(Sort.Direction.DESC, "orderDate"));
        return bills.stream()
                .map(billAdminMapper::mapToBillAdminResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BillFullDetailResponse getBillDetails(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + billId));
        return billAdminMapper.mapToBillFullDetailResponse(bill);
    }

    @Override
    public BillAdminResponse assignStaff(Long billId, Long staffId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));
        if (!"Confirmed".equalsIgnoreCase(bill.getStatus())) {
            throw new InvalidOperationException(
                    "Chỉ có thể gán nhân viên cho đơn hàng ở trạng thái 'Confirmed'. Trạng thái hiện tại: " + bill.getStatus()
            );
        }
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + staffId));
        if (!Role.STAFF.equals(staff.getRole().getName().toUpperCase())) {
            throw new RuntimeException("User is not a staff member: " + staffId);
        }
        bill.setStaff(staff);
        bill.setStatus("Delivering");
        Bill savedBill = billRepository.save(bill);
        return billAdminMapper.mapToBillAdminResponse(savedBill);
    }

    public List<BillAdminResponse> getOrdersForCurrentStaff() {
        User currentStaff = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        int currentStaffId = currentStaff.getId();
        List<String> statuses = List.of("Delivering", "Delivered", "Succeed");
        List<Bill> bills = billRepository.findByStaffIdAndStatusIn(
                currentStaffId,
                statuses,
                Sort.by(Sort.Direction.DESC, "orderDate")
        );
        return bills.stream()
                .map(billAdminMapper::mapToBillAdminResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillAdminResponse completeBillForStaff(Long billId) {
        User currentStaff = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        int currentStaffId = currentStaff.getId();

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));
        if (bill.getStaff() == null || bill.getStaff().getId() != currentStaffId) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật đơn hàng này.");
        }
        if (!bill.getStatus().equals("Delivering")) {
            throw new RuntimeException("Đơn hàng này không ở trạng thái 'Chờ giao'.");
        }
        bill.setStatus("Delivered");
        Bill savedBill = billRepository.save(bill);
        return billAdminMapper.mapToBillAdminResponse(savedBill);
    }

    public List<BillFullDetailResponse> getOrdersForCurrentCustomer() {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        int currentUserId = currentUser.getId();
        List<Bill> bills = billRepository.findByUserId(
                currentUserId,
                Sort.by(Sort.Direction.DESC, "orderDate")
        );
        List<Long> nonCodBillIds = bills.stream()
                .filter(b -> !"COD".equalsIgnoreCase(b.getPaymentMethod()))
                .map(Bill::getId)
                .collect(Collectors.toList());

        Map<Long, String> paymentStatusMap = payTransactionRepository
                .findLatestStatusForBillIds(nonCodBillIds)
                .stream()
                .collect(Collectors.toMap(
                        PayTransaction::getBillId,
                        PayTransaction::getStatus
                ));
        return bills.stream().map(bill -> {
            String paymentStatus;
            if ("COD".equalsIgnoreCase(bill.getPaymentMethod())) {
                paymentStatus = "N/A";
            } else {
                paymentStatus = paymentStatusMap.getOrDefault(bill.getId(), "UNKNOWN");
            }
            return billAdminMapper.mapToBillFullDetailResponse(bill, paymentStatus);
        }).collect(Collectors.toList());
    }

    @Transactional
    public void cancelOrderForCustomer(Long billId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + billId));
        if (bill.getUser().getId() != currentUser.getId()) {
            throw new AccessDeniedException("Bạn không có quyền hủy đơn hàng này.");
        }
        List<String> uncancellableStatuses = List.of("Delivering", "Succeed", "Cancelled");

        if (uncancellableStatuses.contains(bill.getStatus())) {
            throw new RuntimeException("Không thể hủy đơn hàng khi đã ở trạng thái: " + bill.getStatus());
        }
        if (bill.getStatus().equals("Confirmed")) {
            for (BillDetail detail : bill.getDetails()) {
                ProductVariant variant = detail.getVariant();
                if (variant != null) {
                    ProductVariant variantFromDb = variantRepository.findById(variant.getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm (variant) để hoàn kho: " + variant.getId()));
                    variantFromDb.setQuantity(variantFromDb.getQuantity() + detail.getQuantity());
                    variantRepository.save(variantFromDb);
                }
            }
        }
        bill.setStatus("Cancelled");
        billRepository.save(bill);
    }

    @Transactional
    public BillAdminResponse confirmOrderReceived(Long billId) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + billId));
        if (bill.getUser().getId() != currentUser.getId()) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận đơn hàng này.");
        }
        if (!"Delivered".equals(bill.getStatus())) {
            throw new RuntimeException("Đơn hàng này chưa được nhân viên giao hàng xác nhận.");
        }
        bill.setStatus("Succeed");
        Bill savedBill = billRepository.save(bill);
        return billAdminMapper.mapToBillAdminResponse(savedBill);
    }
    @Transactional
    @Override
    public Page<BillAdminResponse> getBillsByUser(Long userId, int page, int limit, String sort) {
        int p = Math.max(0, page - 1); // client 1-based -> Spring 0-based
        Pageable pageable = PageRequest.of(p, limit, toSort(sort));
        return billRepository.findByUser_Id(userId.intValue(), pageable)
                .map(billAdminMapper::mapToBillAdminResponse);
    }
    private Sort toSort(String sort) {
        String s = (sort == null ? "" : sort.toLowerCase());
        return switch (s) {
            case "date_asc"   -> Sort.by("orderDate").ascending();
            case "total_desc" -> Sort.by("total").descending();
            case "total_asc"  -> Sort.by("total").ascending();
            default           -> Sort.by("orderDate").descending(); // date_desc (mặc định)
        };
    }
}
