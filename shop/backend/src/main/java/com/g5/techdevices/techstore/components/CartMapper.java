package com.g5.techdevices.techstore.components;

import com.g5.techdevices.techstore.dtos.cart.CartDTO;
import com.g5.techdevices.techstore.dtos.cart.CartItemDTO;
import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CartMapper {
    public CartDTO toCartDTO(Cart cart) {
        if (cart == null) return null;

        List<CartItemDTO> itemDTOs = cart.getItems().stream()
                .map(this::toCartItemDTO)
                .collect(Collectors.toList());

        // Tính tổng tiền
        BigDecimal totalPrice = itemDTOs.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartDTO.builder()
                .id(cart.getId())
                .items(itemDTOs)
                .totalPrice(totalPrice)
                .build();
    }

    public CartItemDTO toCartItemDTO(CartItem item) {
        if (item == null) return null;

        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();

        return CartItemDTO.builder()
                .variantId(variant.getId())
                .productId(product.getId())
                .productName(product.getName())
                .color(variant.getColor())
                .size(variant.getSize())
                .price(variant.getPrice())
                .quantity(item.getQuantity())
                .build();
    }
}
