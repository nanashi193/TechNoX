import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
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

        this.sizesForSelectedColor = [...new Set(sizes)]; // OK
        const firstAvailableSize = this.sizesForSelectedColor.find(size =>
            this.product!.variants.some(v => v.color === color && v.size === size && v.quantity > 0)
        );
        this.onSizeSelect(firstAvailableSize || this.sizesForSelectedColor[0]);
    }

    onSizeSelect(size: string): void {
        this.selectedSize = size;
        this.updateSelectedVariant();
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

    selectVariant(variant: CustomerVariant): void {
        if (variant.quantity > 0) {
            this.selectedVariant = variant;
            this.quantity = 1;
        }
    }
    isColorOutOfStock(color: string): boolean {
        if (!this.product?.variants) {
            return true; // Nếu không có variant, coi như hết hàng
        }
        return !this.product.variants.some(v => v.color === color && v.quantity > 0);
    }
    isSizeOutOfStock(size: string): boolean {
        if (!this.product?.variants || !this.selectedColor) {
            return true; // Nếu chưa chọn màu, coi như hết
        }
        const variant = this.product.variants.find(v =>
            v.color === this.selectedColor &&
            v.size === size
        );
        return !variant || variant.quantity <= 0;
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

    // --- Logic Giỏ hàng (Cart) ---
    addToCart(){
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

    buyNow(){
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
        this.router.navigate(['/home']);
    }

    // --- HÀM MỚI: Logic chuyển ảnh ---

    /**
     * Chuyển đến ảnh tiếp theo.
     * Nếu đang ở ảnh cuối, quay lại ảnh đầu tiên.
     */
    nextImage(): void {
        if (this.product && this.product.imageUrls && this.product.imageUrls.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.product.imageUrls.length;
        }
    }

    /**
     * Quay lại ảnh trước đó.
     * Nếu đang ở ảnh đầu, chuyển đến ảnh cuối cùng.
     */
    prevImage(): void {
        if (this.product && this.product.imageUrls && this.product.imageUrls.length > 0) {
            const totalImages = this.product.imageUrls.length;
            this.currentImageIndex = (this.currentImageIndex - 1 + totalImages) % totalImages;
        }
    }
}