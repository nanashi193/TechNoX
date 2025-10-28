package com.g5.techdevices.techstore.repositories;

import com.g5.techdevices.techstore.entity.products.ProductImages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImages, Long> {
    @Query("SELECT i FROM ProductImages i WHERE i.product.id = :productId")
    List<ProductImages> findByProductId(@Param("productId") Long productId);

    Optional<ProductImages> findByIdAndProduct_Id(Long id, Long productId);

    void deleteByPublicId(String publicId);

    Optional<ProductImages> findByPublicId(String publicId);
}
