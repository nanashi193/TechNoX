package com.g5.techdevices.techstore.entity.promotions;

import com.g5.techdevices.techstore.entity.products.Product;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "product_promotion")
@IdClass(ProductPromotionId.class) // composite key
public class ProductPromotion {

    @Id
    @Column(name = "product_id", length = 100, nullable = false)
    private String productId;

    @Id
    @Column(name = "promo_id", nullable = false)
    private Integer promoId;

    // Quan hệ
    @ManyToOne
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "promo_id", insertable = false, updatable = false)
    private Promotion promotion;
}

