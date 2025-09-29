package com.g5.techdevices.techstore.entity.products;

import com.g5.techdevices.techstore.entity.Bills.BillDetail;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import jakarta.persistence.Entity;
import lombok.Data;
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
@Table(name = "ProductVariant")
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VariantId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ProductId", nullable = false)
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
