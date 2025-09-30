package com.g5.techdevices.techstore.controllers;


import com.g5.techdevices.techstore.dto.ProductDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/product")
public class ProductController {
    @PostMapping
    public ResponseEntity<String> createProduct(
            @Valid @RequestBody ProductDTO productDTO
    ){ try {
        return ResponseEntity.ok("Product created successfully");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    }
    @GetMapping("")
        public ResponseEntity<String> getProducts(
                @RequestParam("page") int page,
                @RequestParam("limit") int limit
    ){
        return ResponseEntity.ok(String.format("getProduct: here "));
    }
    @GetMapping("/{id}")
        public ResponseEntity <String> getProductById(
                @PathVariable("id") String ProductId
        ){
        return ResponseEntity.ok("Product ID with ID: %d " + ProductId);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable long id
    ){
        return ResponseEntity.status(HttpStatus.OK).body("Product delete successful");
    }
}
