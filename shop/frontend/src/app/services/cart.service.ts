import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../environments/environment';
import { Cart, CartItem } from '../models/cart.model'; // Giả sử bạn có CartItem từ model

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

    // 1. Giữ giỏ hàng từ backend
    private cartSubject = new BehaviorSubject<Cart | null>(null);
    cart$ = this.cartSubject.asObservable();

    // --- LOGIC MỚI: Quản lý các item ĐƯỢC CHỌN ---
    // Chỉ lưu danh sách các variantId được chọn
    private selectedItemsSubject = new BehaviorSubject<number[]>([]);
    /**
     * Observable chứa danh sách các variantId đang được chọn
     */
    selectedItems$ = this.selectedItemsSubject.asObservable();
    // --- KẾT THÚC LOGIC MỚI ---

    // ĐÃ SỬA: Tính tổng SỐ LƯỢNG sản phẩm, không phải số dòng
    itemCount$ = this.cart$.pipe(
        map(cart => {
            // Tính tổng số lượng từ mảng 'items'
            return cart?.items.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
        })
    );

    constructor(private http: HttpClient) {
        this.loadInitialCart();
    }

    private loadInitialCart(): void {
        this.http.get<Cart>(this.apiUrl).subscribe({
            next: cart => {
                this.cartSubject.next(cart);
                // Khi tải lại giỏ hàng, xóa hết các lựa chọn cũ
                this.selectedItemsSubject.next([]);
            },
            error: () => {
                this.cartSubject.next(null);
                this.selectedItemsSubject.next([]);
            }
        });
    }

    /**
     * LẤY giỏ hàng của người dùng hiện tại
     * (Hàm này cũng cập nhật lại local state)
     */
    getCart(): Observable<Cart> {
        return this.http.get<Cart>(this.apiUrl).pipe(
            tap(cart => {
                this.cartSubject.next(cart);
                // Tùy chọn: Bạn có thể muốn giữ lại lựa chọn
                // hoặc xóa đi. Ở đây tôi chọn xóa.
                this.selectedItemsSubject.next([]);
            })
        );
    }

    /**
     * THÊM một sản phẩm vào giỏ
     * (ĐÃ SỬA: Thêm 'tap' để cập nhật subject)
     */
    addItem(variantId: number, quantity: number): Observable<Cart> {
        const payload: AddToCartRequest = { variantId, quantity };
        return this.http.post<Cart>(`${this.apiUrl}`, payload).pipe(
            tap(updatedCart => {
                // Cập nhật giỏ hàng local
                this.cartSubject.next(updatedCart);
            })
        );
    }

    /**
     * XÓA một sản phẩm khỏi giỏ
     * (ĐÃ SỬA: Thêm 'tap' để cập nhật subject VÀ selection)
     */
    removeItem(variantId: number): Observable<Cart> {
        return this.http.delete<Cart>(`${this.apiUrl}/${variantId}`).pipe(
            tap(updatedCart => {
                // Cập nhật giỏ hàng local
                this.cartSubject.next(updatedCart);
                // Xóa item này khỏi danh sách "đã chọn" (nếu có)
                this.deselectItem(variantId);
            })
        );
    }

    /**
     * CẬP NHẬT số lượng của một sản phẩm
     * (ĐÃ SỬA: Thêm 'tap' để cập nhật subject)
     */
    updateQuantity(variantId: number, quantity: number): Observable<Cart> {
        const payload: UpdateQuantityRequest = { quantity };
        return this.http.put<Cart>(`${this.apiUrl}/${variantId}`, payload).pipe(
            tap(updatedCart => {
                // Cập nhật giỏ hàng local
                this.cartSubject.next(updatedCart);
            })
        );
    }

    // --- CÁC HÀM MỚI ĐỂ QUẢN LÝ VIỆC CHỌN (SELECT) ---

    /**
     * HÀM MỚI (Logic chính bạn cần cho 'buyNow')
     * Đặt CÁC MỤC được chọn để thanh toán.
     * @param variantIdsToSelect Danh sách các variantId cần "chọn".
     * Các item khác sẽ bị BỎ "chọn".
     */
    selectItemsForCheckout(variantIdsToSelect: number[]): void {
        this.selectedItemsSubject.next(variantIdsToSelect);
    }

    /**
     * HÀM MỚI (Dùng cho trang giỏ hàng)
     * Bật/tắt trạng thái "chọn" cho một item
     */
    toggleItemSelection(variantId: number): void {
        const currentSelection = [...this.selectedItemsSubject.getValue()];
        const index = currentSelection.indexOf(variantId);

        if (index > -1) {
            // Đã chọn -> Bỏ chọn
            currentSelection.splice(index, 1);
        } else {
            // Chưa chọn -> Chọn
            currentSelection.push(variantId);
        }
        this.selectedItemsSubject.next(currentSelection);
    }

    /**
     * HÀM MỚI (Dùng cho "Mua ngay" để auto-tick)
     * Đảm bảo một item CỤ THỂ được "chọn" (thêm vào danh sách chọn).
     * Sẽ không xóa các lựa chọn khác.
     */
    selectItem(variantId: number): void {
        const currentSelection = [...this.selectedItemsSubject.getValue()];
        const index = currentSelection.indexOf(variantId);

        if (index === -1) {
            // Nếu chưa được chọn -> thêm vào
            currentSelection.push(variantId);
            this.selectedItemsSubject.next(currentSelection);
        }
        // Nếu đã được chọn (index > -1), không làm gì cả
    }

    /**
     * HÀM MỚI (Dùng khi xóa item)
     * Bỏ chọn một item (nếu nó đang được chọn)
     */
    private deselectItem(variantId: number): void {
        const currentSelection = this.selectedItemsSubject.getValue();
        if (currentSelection.includes(variantId)) {
            this.selectedItemsSubject.next(
                currentSelection.filter(id => id !== variantId)
            );
        }
    }

    /**
     * HÀM MỚI (Dùng khi đăng xuất hoặc hoàn tất đơn hàng)
     * Xóa sạch giỏ hàng local và các lựa chọn
     */
    clearLocalCartAndSelection(): void {
        this.cartSubject.next(null);
        this.selectedItemsSubject.next([]);
    }
}