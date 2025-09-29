package com.g5.techdevices.techstore.entity.Cart;

import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "CartItem")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CartItemId")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "CartId", nullable = false)
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "ProductId", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "VariantId")
    private ProductVariant variant;

    @Column(name = "Quantity", nullable = false)
    private Integer quantity;
}

