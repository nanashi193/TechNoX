package com.g5.techdevices.techstore.dtos.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

// Dùng để hiển thị toàn bộ giỏ hàng
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDTO {
    private Integer id;
    private List<CartItemDTO> items;
    private BigDecimal totalPrice;
}