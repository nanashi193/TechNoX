package com.g5.techdevices.techstore.components;

import com.g5.techdevices.techstore.dtos.customer.CustomerProductDTO;
import com.g5.techdevices.techstore.dtos.customer.CustomerVariantDTO;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {
    public CustomerProductDTO mapToCustomerProductDTO(Product product) {
        List<CustomerVariantDTO> variantDTOs = (product.getVariants() != null)
                ? product.getVariants().stream()
                .map(this::mapToCustomerVariantDTO) // Gọi hàm map variant dưới đây
                .collect(Collectors.toList())
                : Collections.emptyList();

        // Tính inStock chung
        boolean inStock = variantDTOs.stream().anyMatch(v -> v.getQuantity() > 0) || product.isStatus();

        return CustomerProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .image(product.getThumbnail())
                .description(product.getDescription())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "")
                .inStock(inStock)
                .variants(variantDTOs)
                .build();
    }

    //Hàm map Variant Entity sang CustomerVariantDTO
    public CustomerVariantDTO mapToCustomerVariantDTO(ProductVariant variant) {
        return CustomerVariantDTO.builder()
                .variantId(variant.getId())
                .sku(variant.getSku())
                .color(variant.getColor())
                .size(variant.getSize())
                .price(variant.getPrice())
                .quantity(variant.getQuantity())
                .build();
    }
}
