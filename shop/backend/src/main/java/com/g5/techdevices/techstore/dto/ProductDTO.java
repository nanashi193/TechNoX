package com.g5.techdevices.techstore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {
    @NotBlank(message = "Title is required!")
    @Size (min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String name;            // nvarchar(255)

    @JsonProperty("product_id")
    private Long productId;// bigint

    @JsonProperty("category_id")
    private String categoryId;// int



    @Min(value = 0, message = "Price must be great than or equal to 0")
    private Double price;       // decimal(18,2)

    private String description;     // nvarchar(MAX)

    private String imageUrl;// nvarchar(1000)

    private LocalDateTime createdAt; // datetime2(7)
    private List<MultipartFile> files;
}
