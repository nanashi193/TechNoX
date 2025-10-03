package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dto.BillDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/bills")
public class BillController {
    @PostMapping("")
    public ResponseEntity<?> createBills(@Valid @RequestBody BillDTO BillDTO, BindingResult result){
        try {
            if(result.hasErrors()){
                List<String> errorMessages = result.getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();
                return ResponseEntity.badRequest().body(errorMessages);
            }
            return ResponseEntity.ok("Create Bill successfully");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
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
