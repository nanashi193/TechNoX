package com.g5.techdevices.techstore.components;

import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.responses.BillResponse;
import org.springframework.stereotype.Component;

@Component
public class BillMapper {

    public BillResponse mapToBillResponse(Bill bill) {
        if (bill == null) {
            return null;
        }

        BillResponse dto = new BillResponse();
        dto.setBillId(bill.getId());
        dto.setUserId(bill.getUser().getId());
        dto.setStatus(bill.getStatus());
        dto.setPaymentMethod(bill.getPaymentMethod());
        dto.setTotal(bill.getTotal());
        dto.setShippingAddress(bill.getShippingAddress());

        if (bill.getUser() != null) {
            dto.setFullName(bill.getUser().getFullName());
            dto.setPhoneNumber(bill.getUser().getPhoneNumber());
        }

        return dto;
    }
}
