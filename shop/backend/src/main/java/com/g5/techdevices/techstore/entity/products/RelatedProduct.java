package com.g5.techdevices.techstore.entity.products;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "RelatedProduct")
public class RelatedProduct {

    @EmbeddedId
    private RelatedProductId id;

    @ManyToOne
    @MapsId("productId")
    @JoinColumn(name = "ProductId")
    private Product product;

    @ManyToOne
    @MapsId("relatedProductId")
    @JoinColumn(name = "RelatedProductId")
    private Product relatedProduct;

    // getters/setters
}
