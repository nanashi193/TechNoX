package com.g5.techdevices.techstore.dtos.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// Dùng để hiển thị 1 món hàng trong giỏ
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private Integer variantId;
    private Long productId;
    private String productName;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer quantity;
    //Có thể thêm imageUrl
}
