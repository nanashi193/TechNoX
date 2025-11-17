import { Component, OnInit, TrackByFunction, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerProduct } from '../../../models/customer-product.model';
import { CustomerProductService } from '../../../services/customer-product.service';

type DeviceFilter = 'all' | 'laptop' | 'ipad' | 'phone';
type SortKey = 'relevance' | 'price_asc' | 'price_desc';

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

    currentPage = 1;
    totalPages = 1;
    totalItems = 0;
    pageSize = 12;

    // Bộ lọc/sắp xếp
    searchTerm = '';
    deviceFilter: DeviceFilter = 'all';
    sortKey: SortKey = 'relevance';

    ngOnInit(): void {
        this.loadProducts(this.currentPage);
    }

    /** Map thiết bị → tên danh mục đúng với BE */
    private deviceToCategoryName(): string | undefined {
        switch (this.deviceFilter) {
            case 'laptop': return 'Laptop';
            case 'ipad':   return 'iPad';
            case 'phone':  return 'Điện thoại';
            default:       return undefined;
        }
    }

    /** Áp sort giá ở FE cho danh sách hiện tại */
    private applyPriceSort(): void {
        const num = (v: unknown) => Number(v ?? 0) || 0;
        if (this.sortKey === 'price_asc') {
            this.products = [...this.products].sort((a, b) => num(a.price) - num(b.price));
        } else if (this.sortKey === 'price_desc') {
            this.products = [...this.products].sort((a, b) => num(b.price) - num(a.price));
        }
    }

    /** Gọi API lấy danh sách sản phẩm */
    loadProducts(page: number): void {
        this.loading = true;

        const pageIndex   = Math.max(0, page - 1);          // BE 0-based
        const category    = this.deviceToCategoryName();    // 'Laptop' | 'iPad' | 'Điện thoại' | undefined
        const search      = this.searchTerm.trim() || undefined;

        this.productSvc
            .getProducts(pageIndex, this.pageSize, category, search, this.sortKey)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe((res) => {
                this.products = res?.content ?? [];

                const meta: any = (res as any).page ?? {};
                this.totalPages  = meta.totalPages ?? 1;
                this.totalItems  = meta.totalElements ?? this.totalPages * this.pageSize;
                this.currentPage = (meta.number ?? pageIndex) + 1;
                this.applyPriceSort();
            });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
    }

    onSortChange(): void {
        this.applyPriceSort();
    }

    onDeviceFilterChange(v: DeviceFilter): void {
        this.deviceFilter = v;
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
    }

    nextPage(): void { if (this.currentPage < this.totalPages) this.loadProducts(this.currentPage + 1); }
    prevPage(): void { if (this.currentPage > 1) this.loadProducts(this.currentPage - 1); }
    goToPage(n: number): void {
        const target = Math.max(1, Math.min(n, this.totalPages));
        if (target !== this.currentPage) this.loadProducts(target);
    }

    trackById: TrackByFunction<CustomerProduct> = (_i, p) => p.id;

    formatPrice(v: unknown): string {
        const n = Number(v) || 0;
        return n.toLocaleString('vi-VN') + ' ₫';
    }
    /**
     * Tính giá "gốc" (ảo) cao hơn 20% so với giá bán.
     * @param v Giá bán từ DB
     * @returns Số tiền đã tăng 20% và làm tròn
     */
    // getOriginalPrice(v: unknown): number {
    //     const n = Number(v) || 0;
    //     if (n === 0) return 0;
    //     const originalPrice = n * 1.20;
    //
    //     return Math.round(originalPrice / 10000) * 10000;
    // }
    viewProduct(p: CustomerProduct): void {
        this.router.navigate(['/product', p.id]);
    }
}