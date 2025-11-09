import { Component, OnInit, TrackByFunction, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerProduct } from '../../../models/customer-product.model';
import { CustomerProductService } from '../../../services/customer-product.service';

type DeviceFilter = 'all' | 'laptop' | 'ipad' | 'phone';
type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc';

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
    deviceFilter: DeviceFilter = 'all';     // all | laptop | ipad | phone
    sortKey: SortKey = 'relevance';         // gửi thẳng lên BE (service sẽ bỏ qua 'relevance')

    ngOnInit(): void {
        this.loadProducts(this.currentPage);
    }

    /** Map thiết bị → tên danh mục đúng với BE */
    private deviceToCategoryName(): string | undefined {
        switch (this.deviceFilter) {
            case 'laptop': return 'Laptop';
            case 'ipad':   return 'iPad';
            case 'phone':  return 'Điện thoại'; // nếu BE dùng 'Phone' thì đổi chuỗi này
            default:       return undefined;     // all
        }
    }

    /** Gọi API lấy danh sách sản phẩm */
    loadProducts(page: number): void {
        this.loading = true;

        const pageIndex = Math.max(0, page - 1);             // BE 0-based
        const categoryName = this.deviceToCategoryName();    // 'Laptop' | 'iPad' | 'Điện thoại' | undefined
        const search = this.searchTerm.trim() || undefined;  // 'search' param
        const sortParam: string | undefined = this.sortKey;  // 'relevance' sẽ bị service bỏ qua

        this.productSvc
            .getProducts(pageIndex, this.pageSize, categoryName, search, sortParam)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe((res) => {
                this.products = res?.content ?? [];

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
    onSortChange(): void {
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
    }
    onDeviceFilterChange(v: DeviceFilter): void {
        this.deviceFilter = v;
        this.currentPage = 1;
        this.loadProducts(this.currentPage);
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
        const n = Number(v) || 0;
        return n.toLocaleString('vi-VN') + ' ₫';
    }
    viewProduct(p: CustomerProduct): void {
        this.router.navigate(['/product', p.id]);
    }
}
