package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.dtos.cart.AddToCartRequestDTO;
import com.g5.techdevices.techstore.dtos.cart.CartDTO;
import com.g5.techdevices.techstore.entity.users.User;
import org.springframework.transaction.annotation.Transactional;

public interface ICartService {
    //Lay gio hang chi tiet
    CartDTO getCartDetails(User user);

    //THÊM sản phẩm (phiên bản) vào giỏ
    @Transactional
    CartDTO addProductToCart(User user, AddToCartRequestDTO requestDTO);

    @Transactional
    CartDTO removeProductFromCart(User user, Long variantId);

    @Transactional
    CartDTO updateProductQuantity(User user, Long variantId, int quantity);
}
