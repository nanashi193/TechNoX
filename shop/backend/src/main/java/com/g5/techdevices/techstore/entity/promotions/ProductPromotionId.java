package com.g5.techdevices.techstore.entity.promotions;

import java.io.Serializable;
import java.util.Objects;

public class ProductPromotionId implements Serializable {
    private String productId;
    private Integer promoId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductPromotionId)) return false;
        ProductPromotionId that = (ProductPromotionId) o;
        return Objects.equals(productId, that.productId) &&
                Objects.equals(promoId, that.promoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, promoId);
    }
}