package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.BillDetailDTO;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/billDetail")
public class BillDetailController {
    @PostMapping
    public ResponseEntity<?> createBillDetail(
            @Valid @RequestBody BillDetail billDetail) {
        return ResponseEntity.ok().body("Create bill detail here");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillDetail(@Valid @PathVariable("id") int id) {
        return  ResponseEntity.ok().body("Get bill detail with id " + id);
    }

    //Lấy ra danh sách BillDetail của một Bill nào đó
    @GetMapping("/bill/{billId}")
    public ResponseEntity<?> getBillDetails(
            @Valid @PathVariable("billId") int billId) {
        return  ResponseEntity.ok().body("Get bill detail with bill id = " + billId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBillDetail(
            @Valid @PathVariable("id") int id,
            @RequestBody BillDetailDTO newBillDetailData){
        return  ResponseEntity.ok().body("Update bill detail with id " + id
        + " with data: " + newBillDetailData);
    }
}
