package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.responses.BillResponse;

import java.util.List;

public interface IBillService {
    BillResponse createBill(BillDTO billDTO) throws DataNotFoundException;
    BillResponse getBill(long id);
    BillResponse updateBill(long id, BillDTO billDTO) throws DataNotFoundException;
    void deleteBill(long id);
    List<BillResponse> findById(long userId);
}
