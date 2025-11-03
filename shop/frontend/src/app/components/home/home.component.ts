import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerProductService } from '../../services/customer-product.service';
import { CustomerProduct } from '../../models/customer-product.model';

interface FeaturedProductVM {
    id: number;
    name: string;
    price: number;
    image: string;
    tags: string[];
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit, OnDestroy, OnInit { // <-- Thêm OnInit
    // ===== Header/Menu/Cookies =====
    mobileMenuOpen = false;
    cookieOpen = true;

    // ===== Poster cover =====
    showCover = true;
    forceOff  = false;

    // ===== Video refs & state =====
    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
    isMuted = true;

    private _timeouts: any[] = [];

    // ===== BƯỚC 2: INJECT SERVICE ===
    private productSvc = inject(CustomerProductService);

    // ===== Accessories + paging (PHỤ KIỆN) =====
    // (Tạm thời giữ nguyên mảng static này. Nếu bạn muốn tải cả phụ kiện từ API
    // (ví dụ: theo category 'Phụ kiện'), chúng ta có thể cập nhật sau)
    accessories = [
        { name: 'Tai nghe Bluetooth', price: 1_290_000, tags: ['Âm thanh HD'],    image: 'assets/accessories/headphone.jpg' },
        { name: 'Sạc nhanh 65W',     price:   690_000, tags: ['Type-C PD'],       image: 'assets/accessories/charger.jpg' },
        { name: 'Ốp lưng iPhone 15', price:   390_000, tags: ['Silicon bảo vệ'],  image: 'assets/accessories/case.jpg' },
        // ... (phần còn lại của accessories) ...
    ];
    page = 1;
    pageSize = 3;
    get totalPages() { return Math.max(1, Math.ceil(this.accessories.length / this.pageSize)); }
    private get pagedAccessories() {
        const start = (this.page - 1) * this.pageSize;
        return this.accessories.slice(start, start + this.pageSize);
    }
    get paged() { return this.pagedAccessories; }
    nextPage(){ if (this.page < this.totalPages) this.page++; }
    prevPage(){ if (this.page > 1) this.page--; }

    featuredProducts: FeaturedProductVM[] = [];
    featuredLoading = true;
    featuredCurrentPage = 1;
    featuredPageSize = 3;
    featuredTotalPages = 1;

    ngOnInit(): void {
        this.loadFeaturedProducts(this.featuredCurrentPage);
    }

    loadFeaturedProducts(page: number): void {
        this.featuredLoading = true;
        const pageIndex = page - 1;

        this.productSvc.getProducts(pageIndex, this.featuredPageSize)
            .pipe(finalize(() => this.featuredLoading = false))
            .subscribe(response => {

                // Cập nhật thông tin paging
                this.featuredTotalPages = response.page.totalPages;
                this.featuredCurrentPage = response.page.number + 1;

                // QUAN TRỌNG: Map dữ liệu API -> Dữ liệu Template
                this.featuredProducts = response.content.map(product => {
                    return {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        tags: [product.categoryName]
                    };
                });
            });
    }

    // Alias trỏ đến các thuộc tính mới
    get heroPaged() { return this.featuredProducts; }
    get heroPage() { return this.featuredCurrentPage; }
    get heroTotalPages() { return this.featuredTotalPages; }

    // Sửa lại hàm Next/Prev để gọi API
    heroNext(){
        if (this.featuredCurrentPage < this.featuredTotalPages) {
            this.loadFeaturedProducts(this.featuredCurrentPage + 1);
        }
    }
    heroPrev(){
        if (this.featuredCurrentPage > 1) {
            this.loadFeaturedProducts(this.featuredCurrentPage - 1);
        }
    }

    // Template dùng trackBy: trackById
    trackById(index: number, item: any): number | string {
        return (item && item.id) ?? index;
    }

    // ===== Menu / cookies =====
    toggleMenu(){ this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu(){ this.mobileMenuOpen = false; }
    acceptCookies(){ this.cookieOpen = false; }
    refuseCookies(){ this.cookieOpen = false; }
    customCookies(){ this.cookieOpen = false; }

    // ===== Lifecycle =====
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

    // ===== Poster cover anim handler =====
    onCoverAnimEnd(e: AnimationEvent) {
        if (e.target !== e.currentTarget) return;
        if (e.animationName === 'cover-out-up' || e.animationName === 'cover-out') {
            this.showCover = false;
        }
    }
    add(product: any): void {
        console.log('Thêm vào giỏ hàng:', product);
    }

    // ===== Video handlers used in template =====
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
}
