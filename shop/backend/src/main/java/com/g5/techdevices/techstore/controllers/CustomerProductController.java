package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.customer.CustomerProductDTO;
import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
import com.g5.techdevices.techstore.services.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
// Đặt đường dẫn riêng cho API khách hàng
@RequestMapping("${api.prefix}/customer/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Cho phép frontend gọi
public class CustomerProductController {

    private final IProductService productService;

    @GetMapping("")
    public ResponseEntity<Page<CustomerProductDTO>> getProductsForCustomer(
            // Tham số page (0-based) và size từ frontend
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
            // (Thêm các @RequestParam khác cho lọc, tìm kiếm nếu cần)
    ) {
        // Tạo đối tượng Pageable cho Service
        Pageable pageable = PageRequest.of(page, size);

        // Gọi Service
        Page<CustomerProductDTO> productPage = productService.getProductsForCustomer(pageable);

        // Trả về Page object (Spring Boot tự chuyển thành JSON)
        return ResponseEntity.ok(productPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerProductDTO> getProductById(@PathVariable Long id) {
        try {
            CustomerProductDTO productDTO = productService.getCustomerProductById(id);
            return ResponseEntity.ok(productDTO);
        } catch (DataNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
