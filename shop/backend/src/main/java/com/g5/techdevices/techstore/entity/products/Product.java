package com.g5.techdevices.techstore.entity.products;

import com.g5.techdevices.techstore.entity.Cart.CartItem;
import com.g5.techdevices.techstore.entity.promotions.Promotion;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.review.Review;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "Product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "CategoryId")
    private Category category;

    @Column(name = "Name", nullable = false, columnDefinition = "nvarchar(255)")
    private String name;

    @Column(name = "Price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "Description", columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "ImageUrl", length = 1000)
    private String imageUrl;

    @OneToMany(mappedBy = "product")
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
}

