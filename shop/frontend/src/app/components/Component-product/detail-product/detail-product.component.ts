import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

// --- Sử dụng Model và Service mới ---
import { CustomerProduct, CustomerVariant } from '../../../models/customer-product.model';
import { CustomerProductService } from '../../../services/customer-product.service';
import { CartService } from '../../../services/cart.service'; // Import CartService

@Component({
    selector: 'app-detail-product',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe],
    templateUrl: './detail-product.component.html',
    styleUrls: ['./detail-product.component.css']
})
export class DetailProductComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private productSvc = inject(CustomerProductService);
    private cartService = inject(CartService);

    product: CustomerProduct | null = null;
    loading = true;
    selectedVariant: CustomerVariant | null = null;
    quantity = 1;

    ngOnInit(): void {
        const productIdString = this.route.snapshot.paramMap.get('id');
        if (productIdString) {
            const productId = Number(productIdString);
            if (!isNaN(productId)) {
                this.loadProduct(productId);
            } else {
                console.error('Invalid product ID in URL');
                this.loading = false;
                this.router.navigate(['/products']);
            }
        } else {
            console.error('No product ID found in URL');
            this.loading = false;
            this.router.navigate(['/products']);
        }
    }

    loadProduct(id: number): void {
        this.loading = true;
        this.productSvc.getProductById(id)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data) => {
                    this.product = data;
                    if (this.product?.variants && this.product.variants.length > 0) {
                        this.selectedVariant = this.product.variants.find(v => v.quantity > 0) || this.product.variants[0];
                    }
                    this.quantity = 1;
                },
                error: (err) => {
                    console.error('Error loading product:', err);
                    this.product = null;
                }
            });
    }

    selectVariant(variant: CustomerVariant): void {
        if (variant.quantity > 0) {
            this.selectedVariant = variant;
            this.quantity = 1;
        }
    }

    // --- Helpers ---
    formatPrice(v: number | undefined | null): string {
        if (v == null) return '';
        return v.toLocaleString('vi-VN') + ' ₫';
    }

    // --- Actions ---
    decQty(){ if (this.quantity > 1) this.quantity--; }
    incQty(){
        // Giới hạn số lượng tối đa theo variant đang chọn (nếu có)
        const maxQty = this.selectedVariant?.quantity;
        if (maxQty === undefined || this.quantity < maxQty) {
            this.quantity++;
        }
    }

    // --- SỬA HÀM addToCart để dùng CartService ---
    addToCart(){
        if (!this.product) return;

        // Xác định ID của variant cần thêm
        const variantToAddId = this.selectedVariant?.variantId;

        // Nếu sản phẩm CÓ variant nhưng chưa chọn -> báo lỗi
        if (this.product.variants && this.product.variants.length > 0 && !variantToAddId) {
            alert('Vui lòng chọn phiên bản (màu sắc/kích thước).');
            return;
        }

        // Nếu variant đã chọn hết hàng
        if (this.selectedVariant && this.selectedVariant.quantity < this.quantity) {
            alert('Số lượng tồn kho không đủ.');
            return;
        }

        // Nếu không có variant (mảng rỗng), tạm thời báo lỗi (cần logic backend để thêm theo productId)
        if (!this.product.variants || this.product.variants.length === 0) {
            alert('Chức năng thêm sản phẩm không có biến thể chưa được hỗ trợ.');
            // console.warn('Adding product without variant - requires backend logic for productId');
            // this.cartService.addItem(this.product.id, this.quantity)... // Ví dụ (cần API hỗ trợ)
            return;
        }

        // Nếu có variant và đã chọn hợp lệ
        if (variantToAddId) {
            console.log(`Adding to cart: Variant ID = ${variantToAddId}, Quantity = ${this.quantity}`);
            this.cartService.addItem(variantToAddId, this.quantity).subscribe({
                next: () => {
                    alert('Đã thêm vào giỏ hàng!');
                    // TODO: Cập nhật số lượng trên icon giỏ hàng (nếu cần)
                },
                error: (err) => {
                    console.error("Lỗi thêm vào giỏ:", err);
                    alert(err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
                }
            });
        }
    }

    // Hàm mua ngay (thêm vào giỏ rồi chuyển trang checkout)
    buyNow(){
        if (!this.product) return;

        // Logic kiểm tra variant và số lượng tương tự addToCart
        const variantToAddId = this.selectedVariant?.variantId;
        if (this.product.variants && this.product.variants.length > 0 && !variantToAddId) {
            alert('Vui lòng chọn phiên bản (màu sắc/kích thước).');
            return;
        }
        if (this.selectedVariant && this.selectedVariant.quantity < this.quantity) {
            alert('Số lượng tồn kho không đủ.');
            return;
        }
        if (!this.product.variants || this.product.variants.length === 0) {
            alert('Chức năng mua ngay sản phẩm không có biến thể chưa được hỗ trợ.');
            return;
        }

        if (variantToAddId) {
            this.cartService.addItem(variantToAddId, this.quantity).subscribe({
                next: () => {
                    this.router.navigate(['/payment-detail']);
                },
                error: (err) => {
                    console.error("Lỗi thêm vào giỏ (Buy Now):", err);
                    alert(err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
                }
            });
        }
    }

    goBack(){
        this.router.navigate(['/products']);
    }
}