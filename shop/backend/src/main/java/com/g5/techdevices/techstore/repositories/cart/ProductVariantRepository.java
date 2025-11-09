package com.g5.techdevices.techstore.repositories.cart;

import com.g5.techdevices.techstore.entity.products.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
}
