import { Component, OnInit, inject, TrackByFunction } from '@angular/core'; // Bỏ các import không dùng nữa
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CustomerProduct } from '../../models/customer-product.model';
import { CustomerProductService } from '../../services/customer-product.service';

@Component({
    selector: 'app-product-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './product-page.component.html',
    styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit {
    private router = inject(Router);
    // --- SỬA: Inject service mới ---
    private productSvc = inject(CustomerProductService);

    // --- SỬA: Dùng model mới ---
    products: CustomerProduct[] = [];

    loading = true;
    currentPage = 1;   // Frontend thường dùng 1-based
    totalPages = 1;
    totalItems = 0;
    pageSize = 12;     // Số lượng sản phẩm/trang

    // Các biến lọc/sắp xếp (sẽ cần tích hợp vào API sau)
    searchTerm = '';
    categoryFilter: string = 'all';
    sortKey: string = 'relevance';

    ngOnInit(): void {
        this.loadProducts(this.currentPage);
    }

    loadProducts(page: number): void {
        this.loading = true;
        const pageIndex = page - 1; // Backend dùng 0-based

        this.productSvc.getProducts(pageIndex, this.pageSize)
            .pipe(finalize(() => this.loading = false))
            .subscribe(response => {
                this.products = response.content;
                this.totalItems = response.page.totalElements;
                this.totalPages = response.page.totalPages;
                this.currentPage = response.page.number + 1

                console.log('Total Pages received:', this.totalPages);
            });
    }

    nextPage(): void { if (this.currentPage < this.totalPages) this.loadProducts(this.currentPage + 1); }
    prevPage(): void { if (this.currentPage > 1) this.loadProducts(this.currentPage - 1); }
    goToPage(n: number): void {
        const targetPage = Math.max(1, Math.min(n, this.totalPages));
        if (targetPage !== this.currentPage) {
            this.loadProducts(targetPage);
        }
    }

    // --- CÁC HÀM KHÁC (ví dụ format giá, điều hướng) ---
    formatPrice(v: number): string { return v.toLocaleString('vi-VN') + ' ₫'; }

    bgImg(url: string): { [key: string]: string } {
        // Trả về một object có key là 'background-image' và value là `url(...)`
        return { 'background-image': `url('${url}')` };
    }

    viewProduct(p: CustomerProduct): void {
        // Sửa: Điều hướng đến trang chi tiết sản phẩm customer
        this.router.navigate(['/product', p.id]);
    }

    get categories(): string[] {
        // Lấy danh sách tên category duy nhất từ mảng products
        const categoryNames = this.products.map(p => p.categoryName);
        const uniqueCategories = Array.from(new Set(categoryNames));

        // Thêm 'all' vào đầu danh sách
        return ['all', ...uniqueCategories];
    }

    trackById: TrackByFunction<CustomerProduct> = (_i, item) => item.id;

    // TODO: Cập nhật hàm lọc/sắp xếp để gọi lại API thay vì lọc/sắp xếp ở frontend
    onFilterChange(): void {
        this.currentPage = 1; // Reset về trang 1 khi lọc
        this.loadProducts(this.currentPage); // Gọi lại API với filter mới (cần sửa hàm loadProducts)
    }
    onSortChange(): void {
        this.currentPage = 1; // Reset về trang 1 khi sắp xếp
        this.loadProducts(this.currentPage); // Gọi lại API với sort mới (cần sửa hàm loadProducts)
    }
    onSearch(): void {
        this.currentPage = 1; // Reset về trang 1 khi tìm kiếm
        this.loadProducts(this.currentPage); // Gọi lại API với keyword mới (cần sửa hàm loadProducts)
    }
}