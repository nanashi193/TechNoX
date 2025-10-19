export interface CartItem {
    variantId: number;
    productId: number;
    productName: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    // ... thêm imageUrl nếu có
}

export interface Cart {
    id: number;
    items: CartItem[];
    totalPrice: number;
}