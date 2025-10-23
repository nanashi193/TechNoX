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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
@Table(name = "Product")
public class Product extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductId")
    private Long id;

    @ManyToOne
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
    private boolean status = true;  // NOTE: mặc định là true (còn hàng)

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("product-variants")
    private List<ProductVariant> variants;

    @OneToMany(mappedBy = "product")
    private List<BillDetail> billDetails;

    @OneToMany(mappedBy = "product")
    private List<CartItem> cartItems;

    @ManyToMany
    @JoinTable(
            name = "ProductPromotion",
            joinColumns = @JoinColumn(name = "ProductId"),
            inverseJoinColumns = @JoinColumn(name = "PromotionId")
    )
    private List<Promotion> promotions;

    @OneToMany(mappedBy = "product")
    private List<Review> reviews;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImages> images;
    @JsonProperty("Category")
    public Map<String, Object> getCategorySummary() {
        if (category == null) return null;
        return Map.of(
                "CategoryId", category.getId(),
                "Name", category.getName()
        );
    }



}

