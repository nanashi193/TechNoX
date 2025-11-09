package com.g5.techdevices.techstore.controllers;

import com.g5.techdevices.techstore.dtos.cart.AddToCartRequestDTO;
import com.g5.techdevices.techstore.dtos.cart.CartDTO;
import com.g5.techdevices.techstore.dtos.cart.UpdateCartItemDTO;
import com.g5.techdevices.techstore.entity.users.User;
import com.g5.techdevices.techstore.services.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("${api.prefix}/carts")
@RequiredArgsConstructor
public class CartController {
    private final ICartService cartService;

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("Bạn chưa đăng nhập hoặc phiên làm việc hết hạn");
        }
        return (User) authentication.getPrincipal();
    }

    @GetMapping("")
    public ResponseEntity<CartDTO> getCart(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CartDTO cartDTO = cartService.getCartDetails(currentUser);
        return ResponseEntity.ok(cartDTO);
    }
    @PostMapping("")
    public ResponseEntity<CartDTO> addCartItem(
            @RequestBody AddToCartRequestDTO requestDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CartDTO cartDTO = cartService.addProductToCart(currentUser, requestDTO);
        return ResponseEntity.ok(cartDTO);
    }
    @DeleteMapping("/{variantId}")
    public ResponseEntity<CartDTO> removeCartItem(
            @PathVariable Long variantId,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CartDTO cartDTO = cartService.removeProductFromCart(currentUser, variantId);
        return ResponseEntity.ok(cartDTO);
    }
    @PutMapping("/{variantId}")
    public ResponseEntity<CartDTO> updateCartItemQuantity(
            @PathVariable Long variantId,
            @RequestBody UpdateCartItemDTO updateDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        CartDTO cartDTO = cartService.updateProductQuantity(currentUser, variantId, updateDTO.getQuantity());
        return ResponseEntity.ok(cartDTO);
    }
}
