package com.g5.techdevices.techstore.services;

import com.g5.techdevices.techstore.components.CartMapper;
import com.g5.techdevices.techstore.dtos.cart.AddToCartRequestDTO;
import com.g5.techdevices.techstore.dtos.cart.CartDTO;
import com.g5.techdevices.techstore.entity.Cart.Cart;
import com.g5.techdevices.techstore.entity.Cart.CartItem;
import com.g5.techdevices.techstore.entity.products.ProductVariant;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.repositories.cart.CartItemRepository;
import com.g5.techdevices.techstore.repositories.cart.CartRepository;
import com.g5.techdevices.techstore.repositories.cart.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService{

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final CartMapper cartMapper;

    /**
     * Lấy giỏ hàng của user. Nếu chưa có, tạo mới.
     */
    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }
    /**
     * LẤY giỏ hàng chi tiết
     */
    @Override
    public CartDTO getCartDetails(User user) {
        Cart cart = getOrCreateCart(user);
        return cartMapper.toCartDTO(cart);
    }
    /**
     * THÊM sản phẩm (phiên bản) vào giỏ
     */
    @Transactional
    @Override
    public CartDTO addProductToCart(User user, AddToCartRequestDTO requestDTO) {
        Cart cart = getOrCreateCart(user);
        ProductVariant variant = variantRepository.findById(requestDTO.getVariantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản sản phẩm"));

        // Kiểm tra xem phiên bản này đã có trong giỏ chưa
        Optional<CartItem> existingItem = cartItemRepository.findByCartAndVariant(cart, variant);

        if (existingItem.isPresent()) {
            // Nếu có, tăng số lượng
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + requestDTO.getQuantity());
            cartItemRepository.save(item);
        } else {
            // Nếu chưa, tạo CartItem mới
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setVariant(variant);
            newItem.setProduct(variant.getProduct()); // Lấy Product từ Variant
            newItem.setQuantity(requestDTO.getQuantity());
            cartItemRepository.save(newItem);
        }
        // Tải lại cart entity để cập nhật list items
        Cart updatedCart = cartRepository.findByUser(user).get();
        return cartMapper.toCartDTO(updatedCart);
    }
    /**
     * XÓA sản phẩm (phiên bản) khỏi giỏ
     */
    @Transactional
    @Override
    public CartDTO removeProductFromCart(User user, Integer variantId) {
        Cart cart = getOrCreateCart(user);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản sản phẩm"));

        cartItemRepository.findByCartAndVariant(cart, variant).ifPresent(item -> {
            cartItemRepository.delete(item); // Xóa món hàng
        });

        return cartMapper.toCartDTO(cart); // Trả về giỏ hàng (đã trống)
    }
    /**
     * CẬP NHẬT số lượng
     */
    @Transactional
    @Override
    public CartDTO updateProductQuantity(User user, Integer variantId, int quantity) {
        if (quantity <= 0) {
            // Nếu số lượng là 0, gọi hàm xóa
            return removeProductFromCart(user, variantId);
        }

        Cart cart = getOrCreateCart(user);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên bản sản phẩm"));

        CartItem item = cartItemRepository.findByCartAndVariant(cart, variant)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không có trong giỏ"));

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        Cart updatedCart = cartRepository.findByUser(user).get();
        return cartMapper.toCartDTO(updatedCart);
    }
}
