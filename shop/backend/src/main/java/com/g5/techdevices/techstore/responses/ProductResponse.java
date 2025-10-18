package com.g5.techdevices.techstore.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.entity.products.Product;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductResponse extends BaseResponse {
    private String name;
    private BigDecimal price;
    private String thumbnail;
    private String description;
    private Boolean status;

    @JsonProperty("CategoryId")
    protected Integer categoryId;
    public static ProductResponse fromProduct(Product product) {
        ProductResponse productRespones =  ProductResponse.builder()
                .name(product.getName())
                .price(product.getPrice())
                .thumbnail(product.getThumbnail())
                .description(product.getDescription())
                .categoryId(product.getCategory().getId())
                .status(product.isStatus())
                .build();
        productRespones.setCreateAt(product.getCreatedAt());
        return productRespones;
    }

}
