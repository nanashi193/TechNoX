package com.g5.techdevices.techstore.dtos.cart;

import lombok.Data;

@Data
//Dùng cho request cập nhật số lượng
public class UpdateCartItemDTO {
    private int quantity;
}
