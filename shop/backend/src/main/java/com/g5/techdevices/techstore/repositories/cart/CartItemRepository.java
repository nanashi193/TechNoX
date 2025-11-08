package com.g5.techdevices.techstore.repositories.cart;

import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    // Tìm một món hàng dựa trên giỏ hàng VÀ phiên bản
    Optional<CartItem> findByCartAndVariant(Cart cart, ProductVariant variant);
    List<CartItem> findByVariant_Product_Id(Long productId);
}
