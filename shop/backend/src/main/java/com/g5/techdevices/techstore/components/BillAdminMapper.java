package com.g5.techdevices.techstore.components;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.pay.PayTransaction;
import com.g5.techdevices.techstore.entity.staff.StaffInfo;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.repositories.PayTransactionRepository;
import com.g5.techdevices.techstore.responses.AdminBillsResponse.BillAdminResponse;
import com.g5.techdevices.techstore.responses.AdminBillsResponse.BillDetailProductResponse;
import com.g5.techdevices.techstore.responses.AdminBillsResponse.BillFullDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BillAdminMapper {

    private final PayTransactionRepository payTransactionRepository;

    private StaffInfo getStaffInfo(Bill bill) {
        User staff = bill.getStaff();
        if (staff != null) {
            return new StaffInfo(
                    staff.getId(),
                    staff.getFullName(),
                    staff.getPhoneNumber()
            );
        }
        return null;
    }

    private String getPaymentStatusForBill(Bill bill) {
        if ("COD".equalsIgnoreCase(bill.getPaymentMethod())) {
            return "N/A";
        }
        return payTransactionRepository
                .findFirstByBillIdOrderByCreatedAtDesc(bill.getId())
                .map(PayTransaction::getStatus)
                .orElse("UNKNOWN");
    }
//---------------------------------------------------------------------------------------------------------//
    public BillAdminResponse mapToBillAdminResponse(Bill bill) {

        StaffInfo staffInfo = null;
        User staff = bill.getStaff();
        if (staff != null) {
            staffInfo = new StaffInfo(
                    staff.getId(),
                    staff.getFullName(),
                    staff.getPhoneNumber()
            );
        }

        String paymentStatus;
        if ("COD".equalsIgnoreCase(bill.getPaymentMethod())) {
            paymentStatus = "N/A";
        } else {
            paymentStatus = payTransactionRepository
                    .findFirstByBillIdOrderByCreatedAtDesc(bill.getId())
                    .map(PayTransaction::getStatus)
                    .orElse("UNKNOWN");
        }

        User user = bill.getUser();
        long userId = (user != null ? user.getId() : null);
        String email = (user != null ? user.getEmail() : null);

        return BillAdminResponse.builder()
                .billId(bill.getId())
                .orderDate(bill.getOrderDate())
                .status(bill.getStatus())
                .total(bill.getTotal())
                .paymentMethod(bill.getPaymentMethod())
                .userId(userId)
                .email(email)
                .customerFullName(bill.getFullName())
                .customerPhone(bill.getPhone())
                .shippingAddress(bill.getShippingAddress())
                .paymentStatus(paymentStatus)
                .staff(staffInfo)
                .build();
    }

    public BillFullDetailResponse mapToBillFullDetailResponse(Bill bill) {

        StaffInfo staffInfo = null;
        if (bill.getStaff() != null) {
            staffInfo = new StaffInfo(
                    bill.getStaff().getId(),
                    bill.getStaff().getFullName(),
                    bill.getStaff().getPhoneNumber()
            );
        }

        String paymentStatus;
        if ("COD".equalsIgnoreCase(bill.getPaymentMethod())) {
            paymentStatus = "N/A";
        } else {
            paymentStatus = payTransactionRepository
                    .findFirstByBillIdOrderByCreatedAtDesc(bill.getId())
                    .map(PayTransaction::getStatus)
                    .orElse("UNKNOWN");
        }

        List<BillDetailProductResponse> productResponses = bill
                .getDetails()
                .stream()
                .map(this::mapToBillDetailProductResponse)
                .collect(Collectors.toList());

        User user = bill.getUser();
        long userId = (user != null ? user.getId() : null);
        String email = (user != null ? user.getEmail() : null);

        return BillFullDetailResponse.builder()
                .billId(bill.getId())
                .userId(userId)
                .orderDate(bill.getOrderDate())
                .status(bill.getStatus())
                .total(bill.getTotal())
                .paymentMethod(bill.getPaymentMethod())
                .customerFullName(bill.getFullName())
                .email(email)
                .customerPhone(bill.getPhone())
                .shippingAddress(bill.getShippingAddress())
                .paymentStatus(paymentStatus)
                .staff(staffInfo)
                .products(productResponses)
                .build();
    }

    public BillFullDetailResponse mapToBillFullDetailResponse(Bill bill, String paymentStatus) {
        StaffInfo staffInfo = getStaffInfo(bill);

        List<BillDetailProductResponse> productResponses = bill
                .getDetails()
                .stream()
                .map(this::mapToBillDetailProductResponse)
                .collect(Collectors.toList());

        return BillFullDetailResponse.builder()
                .billId(bill.getId())
                .orderDate(bill.getOrderDate())
                .status(bill.getStatus())
                .total(bill.getTotal())
                .paymentMethod(bill.getPaymentMethod())
                .customerFullName(bill.getFullName())
                .customerPhone(bill.getPhone())
                .shippingAddress(bill.getShippingAddress())
                .paymentStatus(paymentStatus)
                .staff(staffInfo)
                .products(productResponses)
                .build();
    }

    private BillDetailProductResponse mapToBillDetailProductResponse(BillDetail detail) {
        return BillDetailProductResponse.builder()
                .productId(detail.getProduct().getId())
                .variantId(detail.getVariant() != null ? detail.getVariant().getId() : 0)
                .productName(detail.getProduct().getName())
                .model(detail.getModel())
                .color(detail.getColor())
                .quantity(detail.getQuantity())
                .unitPrice(detail.getUnitPrice())
                .build();
    }
}