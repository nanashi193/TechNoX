package com.g5.techdevices.techstore.responses;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.entity.products.Product;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

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

    private List<ProductVariantResponse> variants;


    @JsonProperty("CategoryId")              // 👈 tên key trong JSON (tuỳ bạn: "category" / "CategoryName")
    private String categoryName;
    public static ProductResponse fromProduct(Product product) {
        ProductResponse productResponse =  ProductResponse.builder()
                .name(product.getName())
                .price(product.getPrice())
                .thumbnail(product.getThumbnail())
                .description(product.getDescription())
                .categoryName(                                   // 👈 set theo tên
                product.getCategory() != null ? product.getCategory().getName() : null)
                .status(product.isStatus())
                .build();
        productResponse.setCreateAt(product.getCreatedAt());
        if (product.getVariants() != null) {
            productResponse.setVariants(
                    product.getVariants().stream()
                            .map(v -> ProductVariantResponse.builder()
                                    .id(v.getId())
                                    .color(v.getColor())
                                    .size(v.getSize())
                                    .quantity(v.getQuantity())
                                    .price(v.getPrice())
                                    .sku(v.getSku())
                                    .build())
                            .collect(Collectors.toList())
            ); }
        return productResponse;
    }

}
