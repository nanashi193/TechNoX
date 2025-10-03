package com.g5.techdevices.techstore.entity.products;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class RelatedProductId implements Serializable {
    private int productId;
    @Column(name = "RelatedProductId")
    private int relatedProductId;

    public RelatedProductId() {}

    public RelatedProductId(int productId, int relatedProductId) {
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
