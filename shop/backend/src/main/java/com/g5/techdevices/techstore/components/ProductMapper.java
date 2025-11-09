package com.g5.techdevices.techstore.components;

import com.g5.techdevices.techstore.dtos.customer.CustomerProductDTO;
import com.g5.techdevices.techstore.dtos.customer.CustomerVariantDTO;
import com.g5.techdevices.techstore.entity.products.Product;
import com.g5.techdevices.techstore.entity.products.ProductImages;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {
    public CustomerProductDTO mapToCustomerProductDTO(Product product) {

        // --- BƯỚC 1: Chuyển đổi List<ProductImages> sang List<String> ---
        // (Giả định ProductImages có hàm getUrl() trả về String)
        List<String> imageUrls = (product.getImages() != null)
                ? product.getImages().stream()
                .map(ProductImages::getImageUrl) // <-- SỬA Ở ĐÂY
                .collect(Collectors.toList())
                : Collections.emptyList();

        // (Nếu hàm không phải là getUrl(), hãy đổi tên, ví dụ: .map(img -> img.getImageUrl()))


        // --- BƯỚC 2: Map các variants (Giữ nguyên) ---
        List<CustomerVariantDTO> variantDTOs = (product.getVariants() != null)
                ? product.getVariants().stream()
                .map(this::mapToCustomerVariantDTO)
                .collect(Collectors.toList())
                : Collections.emptyList();

        // --- BƯỚC 3: Tính toán inStock (Giữ nguyên) ---
        boolean inStock = variantDTOs.stream().anyMatch(v -> v.getQuantity() > 0) || product.isStatus();

        // --- BƯỚC 4: Xây dựng DTO ---
        return CustomerProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .imageUrls(imageUrls) // <-- SỬA Ở ĐÂY (Dùng list đã map)
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
