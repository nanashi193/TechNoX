package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.products.ProductImages;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImages, Long> {
    List<ProductImages> findByProductId(Long productId);
}
