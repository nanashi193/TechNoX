package com.g5.techdevices.techstore.entity.products;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import jakarta.persistence.Entity;
import lombok.*;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Builder
@Table(name = "ProductVariant")
@Getter @Setter
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VariantId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductId", nullable = false)
    @JsonBackReference("product-variants")
    private Product product;

    @Column(name = "Color", length = 100)
    private String color;

    @Column(name = "Size", length = 50)
    private String size;

    @Column(name = "Quantity")
    private Integer quantity;

    @Column(name = "Price", precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "SKU", length = 100)
    private String sku;

    @OneToMany(mappedBy = "variant")
    private List<CartItem> cartItems;

    @OneToMany(mappedBy = "variant")
    private List<BillDetail> billDetails;

}
