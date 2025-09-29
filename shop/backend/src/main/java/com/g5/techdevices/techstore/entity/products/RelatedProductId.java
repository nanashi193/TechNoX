package com.g5.techdevices.techstore.entity.products;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class RelatedProductId implements Serializable {
    private Long productId;
    @Column(name = "RelatedProductId")
    private Long relatedProductId;

    public RelatedProductId() {}

    public RelatedProductId(Long productId, Long relatedProductId) {
        this.productId = productId;
        this.relatedProductId = relatedProductId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RelatedProductId)) return false;
        RelatedProductId that = (RelatedProductId) o;
        return Objects.equals(productId, that.productId) &&
                Objects.equals(relatedProductId, that.relatedProductId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, relatedProductId);
    }
}
