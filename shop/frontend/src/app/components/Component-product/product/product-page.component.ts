import { Component, OnInit, TrackByFunction, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerProduct } from '../../../models/customer-product.model';
import { CustomerProductService } from '../../../services/customer-product.service';

type DeviceFilter = 'all' | 'laptop' | 'ipad' | 'phone';
type SortKey = 'relevance' | 'priceAsc' | 'priceDesc'; // FE-only sort

@Component({
    selector: 'app-product-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './product-page.component.html',
    styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit {
    private router = inject(Router);
    private productSvc = inject(CustomerProductService);

    products: CustomerProduct[] = [];
    loading = true;

    // Phân trang (FE 1-based)
    currentPage = 1;
    totalPages = 1;
    totalItems = 0;
    pageSize = 12;

    // Bộ lọc/sắp xếp
    searchTerm = '';
    deviceFilter: DeviceFilter = 'all';      // all | laptop | ipad | phone
    sortKey: SortKey = 'relevance';          // FE-only sort

    ngOnInit(): void {
        this.loadProducts(this.currentPage);
    }

    /** Map thiết bị → tên danh mục đúng với BE */
    private deviceToCategoryName(): string | undefined {
        switch (this.deviceFilter) {
            case 'laptop': return 'Laptop';
            case 'ipad':   return 'iPad';        // sửa đúng theo DB nếu khác
            case 'phone':  return 'Điện thoại';  // hoặc 'Phone' nếu BE dùng tiếng Anh
            default:       return undefined;     // all
        }
    }

    /** Chuẩn hoá giá về number (xử lý "10.990.000 ₫", "12,345,000", v.v.) */
    private normalizePrice(v: unknown): number {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') {
            // bỏ mọi ký tự không phải số; giữ số âm nếu có nhu cầu thì thêm '-' vào regex
            const cleaned = v.replace(/[^\d]/g, '');
            if (!cleaned) return 0;
            return Number(cleaned);
        }
        return 0;
    }

    /** Lấy giá dùng để sort: ưu tiên price → minPrice → finalPrice → unitPrice */
    private priceOf(p: CustomerProduct): number {
        const anyP: any = p as any;
        const candidates = [anyP.price, anyP.minPrice, anyP.finalPrice, anyP.unitPrice];
        for (const val of candidates) {
            const n = this.normalizePrice(val);
            if (n > 0) return n;
        }
        // nếu giá = 0 vẫn nên trả 0
        return this.normalizePrice(anyP.price ?? anyP.minPrice ?? anyP.finalPrice ?? anyP.unitPrice ?? 0);
    }

    /** Sort mảng products tại chỗ theo sortKey */
    private applyPriceSort(): void {
        if (this.sortKey === 'priceAsc') {
            this.products = [...this.products].sort((a, b) => this.priceOf(a) - this.priceOf(b));
        } else if (this.sortKey === 'priceDesc') {
            this.products = [...this.products].sort((a, b) => this.priceOf(b) - this.priceOf(a));
        }
        // 'relevance' → giữ nguyên thứ tự từ API
    }

    /** Gọi API (không gửi sort lên BE) rồi sort ở FE */
    loadProducts(page: number): void {
        this.loading = true;

        const pageIndex = Math.max(0, page - 1); // BE 0-based
        const categoryName = this.deviceToCategoryName();
        const search = this.searchTerm.trim() || undefined;

        this.productSvc
            // Không gửi sort để BE khỏi can thiệp: tham số sortKey = undefined
            .getProducts(pageIndex, this.pageSize, categoryName, search, undefined)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe((res) => {
                this.products = res?.content ?? [];

                // Sort ở FE dựa trên giá (sau khi nhận dữ liệu)
                this.applyPriceSort();

                // Meta phân trang
                const meta: any = (res as any).page ?? {};
                this.totalPages  = meta.totalPages ?? 1;
                this.totalItems  = meta.totalElements ?? this.totalPages * this.pageSize;
                this.currentPage = (meta.number ?? pageIndex) + 1;
            });
    }

    // Handlers
    onSearch(): void {
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
    }

    onDeviceFilterChange(v: DeviceFilter): void {
        this.deviceFilter = v;
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
    }

    onSortChange(): void {
        // Không gọi API lại; chỉ sort mảng hiện có
        this.applyPriceSort();
    }

    // Phân trang
    nextPage(): void { if (this.currentPage < this.totalPages) this.loadProducts(this.currentPage + 1); }
    prevPage(): void { if (this.currentPage > 1) this.loadProducts(this.currentPage - 1); }
    goToPage(n: number): void {
        const target = Math.max(1, Math.min(n, this.totalPages));
        if (target !== this.currentPage) this.loadProducts(target);
    }

    // Helpers UI
    trackById: TrackByFunction<CustomerProduct> = (_i, p) => p.id;
    formatPrice(v: unknown): string {
        const n = this.normalizePrice(v);
        return n.toLocaleString('vi-VN') + ' ₫';
    }
    viewProduct(p: CustomerProduct): void {
        this.router.navigate(['/product', p.id]);
    }
}
