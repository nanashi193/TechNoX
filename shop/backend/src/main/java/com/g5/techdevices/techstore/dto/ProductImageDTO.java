package com.g5.techdevices.techstore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.g5.techdevices.techstore.entity.products.Product;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageDTO {
    @JsonProperty("ProductId")
    @Min(value = 1, message = ("Product's Id must be > 0"))
    private Long productId;

    @Size(min = 5, max = 200, message=  "Image's name")
    @Column(name = "ImageUrl")
    private String imageUrl;
}
