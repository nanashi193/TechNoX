package com.g5.techdevices.techstore.repositories.cart;

import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Integer> {
    Optional<Cart> findByUser(User user);
    Optional<Cart> findByUserId(int userId);
}
