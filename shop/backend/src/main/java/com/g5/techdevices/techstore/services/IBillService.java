package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.responses.BillResponse;

import java.util.List;

public interface IBillService {
    Bill createBill(BillCreateRequestDTO billDTO) throws DataNotFoundException, InsufficientStockException;
    BillResponse getBill(long id);
    BillResponse updateBill(long id, BillDTO billDTO) throws DataNotFoundException;
    void deleteBill(long id);
    List<BillResponse> findById(long userId);
}
