import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CustomerProduct, CustomerVariant } from '../../../models/customer-product.model';
import { CustomerProductService } from '../../../services/customer-product.service';
import { CartService } from '../../../services/cart.service'; // Import CartService

@Component({
    selector: 'app-detail-product',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
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
    currentImageIndex: number = 0;
    selectedColor: string | null = null;
    selectedSize: string | null = null;
    uniqueColors: string[] = [];
    sizesForSelectedColor: string[] = [];

    ngOnInit(): void {
        const productIdString = this.route.snapshot.paramMap.get('id');
        if (productIdString) {
            const productId = Number(productIdString);
            if (!isNaN(productId)) {
                this.loadProduct(productId);
            } else {
                console.error('Invalid product ID in URL');
                this.loading = false;
                alert('Liên kết sản phẩm không hợp lệ.');
                this.router.navigate(['/products']);
            }
        } else {
            console.error('No product ID found in URL');
            this.loading = false;
            alert('Không tìm thấy sản phẩm.');
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
                    this.quantity = 1;
                    this.currentImageIndex = 0;
                    if (this.product?.variants && this.product.variants.length > 0) {
                        this.updateColorOptions();
                        const firstAvailableColor = this.uniqueColors.find(color =>
                            this.product!.variants.some(v => v.color === color && v.quantity > 0)
                        );
                        this.onColorSelect(firstAvailableColor || this.uniqueColors[0]);
                    } else {
                        this.resetSelections();
                    }
                },
                error: (err) => {
                    console.error('Error loading product:', err);
                    this.product = null;
                    this.resetSelections();
                    alert(err?.error?.message || 'Không tải được thông tin sản phẩm. Vui lòng thử lại.');
                }
            });
    }

    resetSelections(): void {
        this.selectedColor = null;
        this.selectedSize = null;
        this.selectedVariant = null;
        this.uniqueColors = [];
        this.sizesForSelectedColor = [];
    }

    updateColorOptions(): void {
        if (!this.product?.variants) return;
        const colors = this.product.variants
            .map(v => v.color)
            .filter((color): color is string => color != null);
        this.uniqueColors = [...new Set(colors)];
    }

    onColorSelect(color: string): void {
        if (this.selectedColor === color) return;
        this.selectedColor = color;

        const sizes = this.product!.variants
            .filter(v => v.color === color)
            .map(v => v.size)
            .filter((size): size is string => size != null);

        this.sizesForSelectedColor = [...new Set(sizes)];

        // Alert nếu màu được chọn không còn size nào còn hàng
        const hasStockForColor = this.product!.variants.some(v => v.color === color && v.quantity > 0);
        if (!hasStockForColor) {
            alert('Màu này hiện đã hết hàng.');
        }

        const firstAvailableSize = this.sizesForSelectedColor.find(size =>
            this.product!.variants.some(v => v.color === color && v.size === size && v.quantity > 0)
        );
        this.onSizeSelect(firstAvailableSize || this.sizesForSelectedColor[0]);
    }

    onSizeSelect(size: string): void {
        this.selectedSize = size;
        this.updateSelectedVariant();

        // Alert nếu biến thể (màu+size) hết hàng
        if (this.selectedVariant && this.selectedVariant.quantity <= 0) {
            alert('Kích thước này hiện đã hết hàng.');
        }
    }

    updateSelectedVariant(): void {
        if (!this.product || !this.selectedColor || !this.selectedSize) {
            this.selectedVariant = null;
            return;
        }
        this.selectedVariant = this.product.variants.find(v =>
            v.color === this.selectedColor && v.size === this.selectedSize
        ) || null;
        this.quantity = 1;
    }

    // selectVariant(variant: CustomerVariant): void {
    //     if (variant.quantity > 0) {
    //         this.selectedVariant = variant;
    //         this.quantity = 1;
    //     } else {
    //         alert('Biến thể này hiện đã hết hàng.');
    //     }
    // }

    isColorOutOfStock(color: string): boolean {
        if (!this.product?.variants) return true;
        return !this.product.variants.some(v => v.color === color && v.quantity > 0);
    }

    isSizeOutOfStock(size: string): boolean {
        if (!this.product?.variants || !this.selectedColor) return true;
        const variant = this.product.variants.find(v =>
            v.color === this.selectedColor && v.size === size
        );
        return !variant || variant.quantity <= 0;
    }

    // --- Helpers ---
    formatPrice(v: number | undefined | null): string {
        if (v == null) return '';
        return v.toLocaleString('vi-VN') + ' ₫';
    }

    decQty() { if (this.quantity > 1) this.quantity--; }

    incQty() {
        const maxQty = this.selectedVariant?.quantity;
        if (maxQty === undefined || this.quantity < maxQty) {
            this.quantity++;
        } else {
            alert(`Tối đa ${maxQty} sản phẩm cho biến thể này.`);
        }
    }

    addToCart() {
        if (!this.product) return;

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
            alert('Chức năng thêm sản phẩm không có biến thể chưa được hỗ trợ.');
            return;
        }

        if (variantToAddId) {
            console.log(`Adding to cart: Variant ID = ${variantToAddId}, Quantity = ${this.quantity}`);
            this.cartService.addItem(variantToAddId, this.quantity).subscribe({
                next: () => {
                    alert('Đã thêm vào giỏ hàng!');
                },
                error: (err) => {
                    console.error("Lỗi thêm vào giỏ:", err);
                    alert(err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
                }
            });
        }
    }

    buyNow() {
        if (!this.product) return;

        const variantToAddId = this.selectedVariant?.variantId;
        if (this.product.variants && this.product.variants.length > 0 && !variantToAddId) {
            console.warn('Vui lòng chọn phiên bản (màu sắc/kích thước).');
            // Bạn có thể dùng một modal/toast tùy chỉnh ở đây
            return;
        }
        if (this.selectedVariant && this.selectedVariant.quantity < this.quantity) {
            console.warn('Số lượng tồn kho không đủ.');
            return;
        }
        if (!this.product.variants || this.product.variants.length === 0) {
            console.warn('Chức năng mua ngay sản phẩm không có biến thể chưa được hỗ trợ.');
            return;
        }
        if (variantToAddId) {
            this.cartService.addItem(variantToAddId, this.quantity).subscribe({
                next: () => {
                    this.cartService.selectItem(variantToAddId);

                    this.router.navigate(['/cart']);
                },
                error: (err) => {
                    console.error("Lỗi thêm vào giỏ (Buy Now):", err);
                    console.error(err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
                }
            });
        }
    }

    goBack() {
        this.router.navigate(['/home']);
    }
    /** Chuyển đến ảnh tiếp theo. Nếu đang ở ảnh cuối, quay lại ảnh đầu tiên. */
    nextImage(): void {
        if (this.product && this.product.imageUrls && this.product.imageUrls.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.product.imageUrls.length;
        }
    }

    /** Quay lại ảnh trước đó. Nếu đang ở ảnh đầu, chuyển đến ảnh cuối cùng. */
    prevImage(): void {
        if (this.product && this.product.imageUrls && this.product.imageUrls.length > 0) {
            const totalImages = this.product.imageUrls.length;
            this.currentImageIndex = (this.currentImageIndex - 1 + totalImages) % totalImages;
        }
    }
}
