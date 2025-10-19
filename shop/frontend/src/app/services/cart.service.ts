import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Cart } from '../models/cart.model';

interface AddToCartRequest {
    variantId: number;
    quantity: number;
}

interface UpdateQuantityRequest {
    quantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = `${environment.apiBaseUrl}/carts`;

    constructor(private http: HttpClient) { }

    /**
     * LẤY giỏ hàng của người dùng hiện tại
     */
    getCart(): Observable<Cart> {
        return this.http.get<Cart>(this.apiUrl);
    }

    /**
     * THÊM một sản phẩm vào giỏ
     */
    addItem(variantId: number, quantity: number): Observable<Cart> {
        const payload: AddToCartRequest = { variantId, quantity };
        return this.http.post<Cart>(`${this.apiUrl}`, payload);
    }

    /**
     * XÓA một sản phẩm khỏi giỏ
     */
    removeItem(variantId: number): Observable<Cart> {
        return this.http.delete<Cart>(`${this.apiUrl}/${variantId}`);
    }

    /**
     * CẬP NHẬT số lượng của một sản phẩm
     */
    updateQuantity(variantId: number, quantity: number): Observable<Cart> {
        const payload: UpdateQuantityRequest = { quantity };
        return this.http.put<Cart>(`${this.apiUrl}/${variantId}`, payload);
    }
}