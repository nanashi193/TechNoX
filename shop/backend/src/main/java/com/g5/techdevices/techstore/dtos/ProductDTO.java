package com.g5.techdevices.techstore.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductDTO {
    @NotBlank(message = "Title is required!")

    @Size (min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String name;            // nvarchar(255)

    private Long productId;// bigint

    @NotNull(message = "categoryId is required")
    @JsonProperty("CategoryId")
    private Integer categoryId;// int



    @Min(value = 0, message = "Price must be great than or equal to 0")
    private BigDecimal price;       // decimal(18,2)

    private String description;     // nvarchar(MAX)

    private String imageUrl;// nvarchar(1000)

    private LocalDateTime createdAt; // datetime2(7)

    private String thumbnail;

    private Boolean status; // Cho phép null khi update, vẫn mặc định true ở entity

    private List<ProductVariantDTO> variants; // ✅ thêm dòng này

}
