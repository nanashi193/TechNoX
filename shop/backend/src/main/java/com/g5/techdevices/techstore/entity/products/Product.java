package com.g5.techdevices.techstore.entity.products;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import com.g5.techdevices.techstore.entity.promotions.Promotion;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.review.Review;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "Product")
public class Product extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryId")
    @JsonBackReference
    private Category category;

    @Column(name = "Name", nullable = false, columnDefinition = "nvarchar(255)")
    private String name;

    @Column(name = "Price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "Description", columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "Thumbnail", length = 300)
    private String thumbnail;

    @Column(name = "status", nullable = false)
    private boolean status = true;

    // ==== 2 collection "bag" dễ gây MultipleBagFetchException ====
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("product-variants")
    @Fetch(FetchMode.SUBSELECT)          // ✅ tránh MultipleBagFetch
    @BatchSize(size = 50)                // ✅ giảm N+1 (tuỳ chọn)
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Fetch(FetchMode.SUBSELECT)          // ✅ tránh MultipleBagFetch
    @BatchSize(size = 50)
    private List<ProductImages> images = new ArrayList<>();

    // Các collection khác giữ LAZY (không fetch cùng lúc)
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<BillDetail> billDetails = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<CartItem> cartItems = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ProductPromotion",
            joinColumns = @JoinColumn(name = "ProductId"),
            inverseJoinColumns = @JoinColumn(name = "PromotionId")
    )
    private List<Promotion> promotions = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    @JsonProperty("Category")
    public Map<String, Object> getCategorySummary() {
        if (category == null) return null;
        return Map.of(
                "CategoryId", category.getId(),
                "Name", category.getName()
        );
    }
}
