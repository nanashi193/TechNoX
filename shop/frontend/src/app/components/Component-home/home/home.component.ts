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
    mobileMenuOpen = false;
    cookieOpen = true;
    showCover = true;
    forceOff  = false;

    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('hotSaleScroller') hotSaleScrollerRef!: ElementRef<HTMLDivElement>;
    isMuted = true;
    private _timeouts: any[] = [];
    private productSvc = inject(CustomerProductService);

    phoneProducts: CustomerProduct[] = [];
    laptopProducts: CustomerProduct[] = [];
    accessoryProducts: CustomerProduct[] = [];
    hotSaleProducts: CustomerProduct[] = [];

    phonesLoading = true;
    laptopsLoading = true;
    accessoriesLoading = true;
    hotSaleLoading = true;
    countdown: { days: string, hours: string, minutes: string, seconds: string } = { days: '00', hours: '00', minutes: '00', seconds: '00' };
    private countdownInterval: any;
    private saleEndDate!: Date;

    private readonly productsPerCategory = 6;
    private readonly hotSaleProductCount = 10;


    ngOnInit(): void {
        this.loadCategoryProducts('Điện thoại');
        this.loadCategoryProducts('Laptop');
        this.loadCategoryProducts('Phụ kiện');
        this.loadHotSaleProducts();
        const today = new Date();
        const dayOfWeek = today.getDay();
        // (Nếu hôm nay là CN, daysUntilSunday = 7, sale kết thúc CN tuần sau)
        const daysUntilSunday = (dayOfWeek === 0 ? 7 : 7 - dayOfWeek);
        // Đặt sale kết thúc vào 00:00:00 (nửa đêm) Chủ Nhật
        this.saleEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilSunday, 0, 0, 0);
        //Cập nhật đồng hồ ngay lập tức và sau đó mỗi giây
        this.updateCountdown(); // Chạy 1 lần ngay
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

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

        this.productSvc.getProducts(0, this.productsPerCategory, categoryName, undefined, 'relevance')
            .pipe(finalize(() => {
                this[loadingFlag] = false;
            }))
            .subscribe(response => {
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

    /**
     * Tải sản phẩm Hot Sale
     * Không lọc category, sắp xếp 'id_desc' (mới nhất/từ dưới lên)
     */
    loadHotSaleProducts(): void {
        this.hotSaleLoading = true;
        this.productSvc.getProducts(0, this.hotSaleProductCount, undefined, undefined, 'id_desc')
            .pipe(finalize(() => {
                this.hotSaleLoading = false;
            }))
            .subscribe(response => {
                this.hotSaleProducts = response.content.map(p => ({
                    ...p,
                    imageUrls: p.imageUrls || []
                }));
            });
    }
    trackById(index: number, item: CustomerProduct): number {
        return item.id;
    }

    toggleMenu(){ this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu(){ this.mobileMenuOpen = false; }
    acceptCookies(){ this.cookieOpen = false; }
    refuseCookies(){ this.cookieOpen = false; }
    customCookies(){ this.cookieOpen = false; }

    ngAfterViewInit(): void {
        this._timeouts.push(setTimeout(() => { this.showCover = false; }, 2300));
        this._timeouts.push(setTimeout(() => { this.forceOff = true; this.showCover = false; }, 3500));
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
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }
    updateCountdown() {
        const now = new Date().getTime();
        const distance = this.saleEndDate.getTime() - now;

        if (distance < 0) {
            // Hết giờ sale
            this.countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' };
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Gán vào biến
        this.countdown = {
            days: this.pad(days),
            hours: this.pad(hours),
            minutes: this.pad(minutes),
            seconds: this.pad(seconds)
        };
    }
    scrollHotSale(direction: 'prev' | 'next'): void {
        try {
            const el = this.hotSaleScrollerRef.nativeElement;
            const scrollAmount = el.clientWidth * 0.8;

            if (direction === 'prev') {
                el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Lỗi khi cuộn Hot Sale:", error);
        }
    }
    onCoverAnimEnd(e: AnimationEvent) {
        if (e.target !== e.currentTarget) return;
        if (e.animationName === 'cover-out-up' || e.animationName === 'cover-out') {
            this.showCover = false;
        }
    }
    add(product: any): void {
        console.log('Thêm vào giỏ hàng:', product);
    }

    getOriginalPrice(v: number | undefined | null): number {
        const n = Number(v) || 0;
        if (n === 0) return 0;
        const originalPrice = n * 1.20;
        return Math.round(originalPrice / 10000) * 10000;
    }

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