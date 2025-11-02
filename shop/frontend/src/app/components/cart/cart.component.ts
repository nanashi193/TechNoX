import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

    private cartService = inject(CartService);
    private router = inject(Router);

    cart: Cart | null = null;
    loading = true; // Thêm trạng thái loading
    error: string | null = null;
    allSelected = false;

    ngOnInit(): void {
        this.loadCart();
    }

    // ==== Tải dữ liệu ====
    loadCart(): void {
        this.loading = true;
        this.error = null;
        this.allSelected = false;

        this.cartService.getCart().subscribe({
            next: (data) => {
                // Khởi tạo trạng thái selected cho từng item
                if (data && data.items) {
                    data.items.forEach(item => item.selected = false);
                }
                this.cart = data;
                this.loading = false;
                this.updateAllSelectedState();
            },
            error: (err) => {
                console.error('Lỗi khi tải giỏ hàng:', err);
                this.error = 'Không thể tải giỏ hàng. Vui lòng thử lại.';
                this.loading = false;
            }
        });
    }

    // ==== Computed (Tính toán) ====
    get selectedItems(): CartItem[] {
        return this.cart?.items.filter(item => item.selected) || [];
    }

    get totalSelectedQuantity(): number {
        return this.selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    get totalSelectedAmount(): number {
        return this.selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    //=====Check box=====
    updateAllSelectedState(): void {
        if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
            this.allSelected = false;
            return;
        }
        this.allSelected = this.cart.items.every(item => item.selected);
    }

    toggleSelectAll(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.allSelected = checked;
        if (this.cart && this.cart.items) {
            this.cart.items.forEach(item => item.selected = checked);
        }
    }

    onItemSelectChange(): void {
        this.updateAllSelectedState();
    }

    /**
     * Tăng số lượng
     */
    inc(item: CartItem) {
        // Gọi hàm update với số lượng mới
        this.updateQuantity(item.variantId, item.quantity + 1);
    }
    /**
     * Giảm số lượng
     */
    dec(item: CartItem) {
        // Backend sẽ tự xóa nếu số lượng <= 0
        if (item.quantity <= 0) return;
        this.updateQuantity(item.variantId, item.quantity - 1);
    }
    /**
     * Cập nhật số lượng từ input
     */
    updateQuantityFromInput(item: CartItem, event: any) {
        const newQuantity = (event.target as HTMLInputElement).valueAsNumber;
        if (newQuantity < 0 || isNaN(newQuantity)) {
            // Nếu số lượng không hợp lệ, quay về số lượng cũ
            (event.target as HTMLInputElement).value = String(item.quantity);
            return;
        }
        this.updateQuantity(item.variantId, newQuantity);
    }
    /**
     * Hàm gọi API cập nhật số lượng
     */
    updateQuantity(variantId: number, quantity: number) {
        this.cartService.updateQuantity(variantId, quantity).subscribe({
            next: (updatedCart) => {
                // 9. Gán lại giỏ hàng mới từ phản hồi của server
                this.cart = updatedCart;
            },
            error: (err) => {
                console.error('Lỗi khi cập nhật số lượng:', err);
                // Tùy chọn: Tải lại giỏ hàng để đồng bộ
                this.loadCart();
            }
        });
    }
    /**
     * Xóa một món hàng
     */
    remove(item: CartItem) {
        if (!confirm(`Bạn có chắc muốn xóa "${item.productName}" khỏi giỏ hàng?`)) {
            return;
        }

        this.cartService.removeItem(item.variantId).subscribe({
            next: (updatedCart) => {
                this.cart = updatedCart;
            },
            error: (err) => console.error('Lỗi khi xóa:', err)
        });
    }

    trackByItem = (_: number, it: CartItem) => it.variantId;

    goToPayment(): void {
        const itemsToCheckout = this.selectedItems;

        if (itemsToCheckout.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
            return;
        }

        const selectedVariantIds = itemsToCheckout.map(item => item.variantId);
        sessionStorage.setItem('selectedCartItemIds', JSON.stringify(selectedVariantIds));
        console.log("Các sản phẩm sẽ thanh toán:", itemsToCheckout);

        // Ví dụ cách 3: Truyền state qua router
        this.router.navigate(['/payment-detail'], {
            state: { selectedItems: itemsToCheckout }
        });

        // Hoặc đơn giản chỉ điều hướng nếu trang Payment tự lấy lại giỏ hàng
        // this.router.navigate(['/payment-detail']);
    }
}