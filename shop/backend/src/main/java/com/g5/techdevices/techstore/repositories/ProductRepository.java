package com.g5.techdevices.techstore.repositories;                  // NOTE: đổi package

import com.g5.techdevices.techstore.entity.products.Category;       // NOTE: đổi import
import com.g5.techdevices.techstore.entity.products.Product;        // NOTE: đổi import
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // NOTE: đổi thành IgnoreCase cho đúng service hiện dùng
    boolean existsByNameIgnoreCase(String name);

    // (kế thừa sẵn từ JpaRepository nhưng bạn đang gọi trực tiếp -> giữ lại)
    Page<Product> findAll(Pageable pageable);

    List<Product> findByCategory(Category category);

    // NOTE: sửa tên cột/field theo entity Product (name, description, category.id)
    //       dùng LOWER + CONCAT cho tìm kiếm an toàn
    @Query(value = """
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.variants v
        WHERE (:categoryId = 0 OR p.category.id = :categoryId)
          AND (
                :keyword = '' 
             OR LOWER(p.name)        LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
          AND (
                :sku = '' 
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :sku, '%'))
          )
          AND (
                :minPrice IS NULL 
             OR COALESCE(v.price, p.price) >= :minPrice
          )
          AND (
                :maxPrice IS NULL 
             OR COALESCE(v.price, p.price) <= :maxPrice
          )
        """,
            countQuery = """
        SELECT COUNT(DISTINCT p)
        FROM Product p
        LEFT JOIN p.variants v
        WHERE (:categoryId = 0 OR p.category.id = :categoryId)
          AND (
                :keyword = '' 
             OR LOWER(p.name)        LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
          AND (
                :sku = '' 
             OR LOWER(v.sku) LIKE LOWER(CONCAT('%', :sku, '%'))
          )
          AND (
                :minPrice IS NULL 
             OR COALESCE(v.price, p.price) >= :minPrice
          )
          AND (
                :maxPrice IS NULL 
             OR COALESCE(v.price, p.price) <= :maxPrice
          )
        """
    )
    Page<Product> search(
            @Param("keyword") String keyword,
            @Param("sku") String sku,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );


    // NOTE: đổi tên quan hệ từ productImages -> images (đúng với entity của bạn)
    // NOTE: đổi tên method thành findDetailById để khớp service ProductService.getProductById()
    //       CHỈ fetch images (không fetch reviews) để tránh MultipleBagFetchException
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :productId")
    Optional<Product> findDetailById(@Param("productId") Long productId);

    @Query("SELECT p FROM Product p WHERE p.id IN :productIds")
    List<Product> findProductsByIds(@Param("productIds") List<Long> productIds);

    // NOTE: XÓA method favorites vì entity Product hiện tại của bạn KHÔNG có quan hệ favorites
    // @Query("SELECT p FROM Product p JOIN p.favorites f WHERE f.user.id = :userId")
    // List<Product> findFavoriteProductsByUserId(@Param("userId") Long userId);
}
