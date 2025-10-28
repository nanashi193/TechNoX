import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
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

    //Tạo một BehaviorSubject để LƯU TRỮ giỏ hàng
    //giữ giá trị Cart cuối cùng
    private cartSubject =
        new BehaviorSubject<Cart | null>(null);
    //Tạo một Observable công khai để các component khác "lắng nghe"
    cart$ = this.cartSubject.asObservable();
    //Tạo một observable CHỈ chứa số lượng sản phẩm
    //Cho vao Header component
    itemCount$ = this.cart$.pipe(
        map(cart => {
            // QUAN TRỌNG: Hãy điều chỉnh logic này cho đúng với model 'Cart' của bạn.
            // Nếu model 'Cart' có thuộc tính 'totalQuantity', hãy dùng:
            // return cart?.totalQuantity ?? 0;

            // Nếu bạn muốn tính tổng số lượng từ mảng 'items':
            // return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

            // Nếu bạn chỉ muốn đếm số LOẠI sản phẩm (số dòng trong giỏ):
            return cart?.items?.length ?? 0;
        })
    );
    constructor(private http: HttpClient) {
        //Tải giỏ hàng lần đầu khi ứng dụng chạy
        this.loadInitialCart();
    }
    private loadInitialCart(): void {
        this.http.get<Cart>(this.apiUrl).subscribe({
            next: cart => this.cartSubject.next(cart),
            error: () => this.cartSubject.next(null)
        });
    }

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