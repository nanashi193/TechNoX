package com.g5.techdevices.techstore.entity.products;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "ProductImages")
public class ProductImages {
    public static final int MAXIMUM_IMAGES_PER_PRODUCT = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name= "ProductId")
    private Product product;

    @Column(name = "ImageUrl", columnDefinition = "nvarchar(500)") // lưu full https URL
    private String imageUrl;

    @Column(name = "PublicId", nullable = false, unique = true, columnDefinition = "nvarchar(255)")
    private String publicId; // <-- BẮT BUỘC để xoá Cloudinary

}
