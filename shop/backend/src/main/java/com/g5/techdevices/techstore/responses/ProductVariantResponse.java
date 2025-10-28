package com.g5.techdevices.techstore.responses;

import lombok.*;

import java.math.BigDecimal;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String color;
    private String size;
    private Integer quantity;
    private BigDecimal price;
    private String sku;


    // ✅ Thêm 2 field để FE biết trạng thái tồn kho
    private boolean inStock;    // true nếu quantity > 0
    private boolean selectable; // = inStock, FE dùng để disable nút chọn
}

