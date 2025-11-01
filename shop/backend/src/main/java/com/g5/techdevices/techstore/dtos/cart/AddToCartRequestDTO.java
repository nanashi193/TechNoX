package com.g5.techdevices.techstore.dtos.cart;

import lombok.Data;

@Data
// Dùng cho request thêm vào giỏ
public class AddToCartRequestDTO {
    private Long variantId;
    private int quantity;
}
