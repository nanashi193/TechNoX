import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Import CurrencyPipe
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerProductService } from '../../../services/customer-product.service';
import { CustomerProduct } from '../../../models/customer-product.model'; // Import interface chính

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, CurrencyPipe], // Thêm CurrencyPipe vào imports
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit, OnDestroy, OnInit {
    // ===== Header/Menu/Cookies (GIỮ NGUYÊN) =====
    mobileMenuOpen = false;
    cookieOpen = true;

    // ===== Poster cover (GIỮ NGUYÊN) =====
    showCover = true;
    forceOff  = false;

    // ===== Video refs & state (GIỮ NGUYÊN) =====
    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
    isMuted = true;
    private _timeouts: any[] = [];

    // ===== Service (GIỮ NGUYÊN) =====
    private productSvc = inject(CustomerProductService);

    // ===== BƯỚC 1: Thay thế logic "Featured" bằng 3 danh mục =====
    phoneProducts: CustomerProduct[] = [];
    laptopProducts: CustomerProduct[] = [];
    accessoryProducts: CustomerProduct[] = [];

    // Thêm 3 cờ loading riêng biệt
    phonesLoading = true;
    laptopsLoading = true;
    accessoriesLoading = true;

    // Số lượng sản phẩm hiển thị cho mỗi mục (bạn có thể đổi số này)
    private readonly productsPerCategory = 6;

    // ===== BƯỚC 2: Cập nhật ngOnInit =====
    ngOnInit(): void {
        // Tải cả 3 danh mục
        this.loadCategoryProducts('Điện thoại');
        this.loadCategoryProducts('Laptop');
        this.loadCategoryProducts('Phụ kiện');
    }

    // ===== BƯỚC 3: Thêm hàm tải theo danh mục =====
    loadCategoryProducts(categoryName: 'Điện thoại' | 'Laptop' | 'Phụ kiện'): void {

        let loadingFlag: 'phonesLoading' | 'laptopsLoading' | 'accessoriesLoading';
        switch (categoryName) {
            case 'Điện thoại':
                loadingFlag = 'phonesLoading';
                this.phonesLoading = true;
                break;
            case 'Laptop':
                loadingFlag = 'laptopsLoading';
                this.laptopsLoading = true;
                break;
            case 'Phụ kiện':
                loadingFlag = 'accessoriesLoading';
                this.accessoriesLoading = true;
                break;
        }

        /**
         * Giả định: hàm getProducts chấp nhận (pageIndex, pageSize, categoryName)
         * Chúng ta lấy trang 0 (trang đầu tiên) và số lượng 3 sản phẩm
         */
        this.productSvc.getProducts(0, this.productsPerCategory, categoryName)
            .pipe(finalize(() => {
                // Tắt cờ loading khi hoàn tất
                this[loadingFlag] = false;
            }))
            .subscribe(response => {
                // Gán dữ liệu, đảm bảo imageUrls luôn là một mảng
                const products = response.content.map(p => ({
                    ...p,
                    imageUrls: p.imageUrls || []
                }));

                switch (categoryName) {
                    case 'Điện thoại':
                        this.phoneProducts = products;
                        break;
                    case 'Laptop':
                        this.laptopProducts = products;
                        break;
                    case 'Phụ kiện':
                        this.accessoryProducts = products;
                        break;
                }
            });
    }

    // ===== BƯỚC 4: Cập nhật trackById (để gõ chữ mạnh hơn) =====
    trackById(index: number, item: CustomerProduct): number {
        return item.id;
    }

    // ===== Menu / cookies (GIỮ NGUYÊN) =====
    toggleMenu(){ this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu(){ this.mobileMenuOpen = false; }
    acceptCookies(){ this.cookieOpen = false; }
    refuseCookies(){ this.cookieOpen = false; }
    customCookies(){ this.cookieOpen = false; }

    // ===== Lifecycle (GIỮ NGUYÊN) =====
    ngAfterViewInit(): void {
        this._timeouts.push(setTimeout(() => { this.showCover = false; }, 2300));
        this._timeouts.push(setTimeout(() => { this.forceOff = true; this.showCover = false; }, 3500));
        // Ép autoplay video (đa số trình duyệt yêu cầu muted)
        const v = this.heroVideo?.nativeElement;
        if (v) {
            v.muted = true;
            const p = v.play();
            if (p) {
                p.catch(() => {
                    v.muted = true;
                    v.play().catch(() => {});
                });
            }
        }
    }

    ngOnDestroy(): void {
        this._timeouts.forEach(t => clearTimeout(t));
    }

    // ===== Poster cover anim handler (GIỮ NGUYÊN) =====
    onCoverAnimEnd(e: AnimationEvent) {
        if (e.target !== e.currentTarget) return;
        if (e.animationName === 'cover-out-up' || e.animationName === 'cover-out') {
            this.showCover = false;
        }
    }
    add(product: any): void {
        console.log('Thêm vào giỏ hàng:', product);
    }

    // ===== Video handlers (GIỮ NGUYÊN) =====
    toggleMute(videoEl: HTMLVideoElement) {
        this.isMuted = !this.isMuted;
        videoEl.muted = this.isMuted;
        if (!this.isMuted) videoEl.play().catch(() => {});
    }

    onVideoError(evt: Event) {
        const v = evt.target as HTMLVideoElement;
        console.error('VIDEO ERROR:', v?.error);
    }

    onVideoCanPlay() {
        // Hook khi video đã đủ dữ liệu để play
    }

    // ===== CÁC HÀM CŨ ĐÃ BỊ XÓA =====
    // - Mảng `accessories` tĩnh (giờ tải từ API)
    // - các hàm `page`, `pageSize`, `totalPages`, `pagedAccessories`, `paged`, `nextPage`, `prevPage`
    // - `featuredProducts`
    // - `loadFeaturedProducts`
    // - `heroPaged`, `heroPage`, `heroTotalPages`, `heroNext`, `heroPrev`
}