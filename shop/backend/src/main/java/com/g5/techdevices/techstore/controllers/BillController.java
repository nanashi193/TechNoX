package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.BillCreateRequestDTO;
import com.g5.techdevices.techstore.dtos.BillDTO;
import com.g5.techdevices.techstore.entity.Bills.Bill;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.exceptions.InsufficientStockException;
import com.g5.techdevices.techstore.services.IBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/bills")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BillController {
    private final IBillService billService;
    @PostMapping("")
    public ResponseEntity<?> createBill(
            @Valid @RequestBody BillCreateRequestDTO billDTO,
            BindingResult result
    ) {
        // Kiểm tra validation DTO
        if (result.hasErrors()){
            List<String> errorMessages = result.getFieldErrors()
                    .stream()
                    .map(FieldError::getDefaultMessage)
                    .toList();
            return ResponseEntity.badRequest().body(errorMessages);
        }

        try {
            Bill createdBill = billService.createBill(billDTO);
            // Trả về thông tin Bill đã tạo (hoặc chỉ ID, hoặc message thành công)
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBill);
        } catch (DataNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (InsufficientStockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage())); // Lỗi 409 Conflict
        } catch (Exception e) {
            // Lỗi chung
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
    @GetMapping("/{UserId}")
    public ResponseEntity<?> getBills(@Valid @PathVariable("UserId") int UserId){
        try {
            return ResponseEntity.ok("Lấy ra danh sách bills từ UserId");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("{id}")
    public ResponseEntity<?> updateBills(@Valid @PathVariable("id") int id,
                                         @Valid @RequestBody BillDTO BillDTO) {
        return ResponseEntity.ok("Update Bill successfully");
    }
}
