import { Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgOptimizedImage, NgIf } from '@angular/common'; // 👈 THÊM NgIf
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-site-header',
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive,
        AsyncPipe,
        NgOptimizedImage,
        NgIf, // 👈 THÊM NgIf
    ],
    templateUrl: './site-header.component.html',
    styleUrls: ['./site-header.component.css']
})
export class SiteHeaderComponent implements OnDestroy {
    mobileMenuOpen = false;
    userMenuOpen   = false;

    currentUser$: Observable<any>;
    itemCount$:   Observable<number>;

    private outsideClickHandler?: (ev: MouseEvent) => void;

    constructor(
        private cartService: CartService,
        private authService: AuthService
    ) {
        this.currentUser$ = this.authService.currentUser$;
        this.itemCount$   = this.cartService.itemCount$;
    }
    isOwner(user: any): boolean {
        return user?.roleName === 'Owner' || user?.authorities?.includes('OWNER')
            || user?.roleName === 'Admin' || user?.authorities?.includes('Admin')
            || user?.roleName === 'Staff' || user?.authorities?.includes('Staff');
    }

    // ===== Mobile menu =====
    toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu()  { this.mobileMenuOpen = false; }

    // ===== User dropdown =====
    toggleUserMenu(evt?: MouseEvent) {
        if (evt) { evt.stopPropagation(); evt.preventDefault(); }

        console.log('[header] BEFORE toggle:', this.userMenuOpen);
        if (this.userMenuOpen) { this.closeUserMenu(); return; }

        this.userMenuOpen = true;
        console.log('[header] AFTER toggle:', this.userMenuOpen);

        // đăng ký outside-click ở tick kế tiếp để tránh tự đóng
        setTimeout(() => {
            this.outsideClickHandler = (e: MouseEvent) => {
                const target = e.target as HTMLElement | null;
                if (target?.closest('.user-menu')) return; // click trong menu -> bỏ qua
                this.closeUserMenu();
            };
            document.addEventListener('click', this.outsideClickHandler!, { once: true });
        }, 0);
    }

    closeUserMenu(evt?: MouseEvent) {
        if (evt) { evt.stopPropagation(); evt.preventDefault(); }
        if (!this.userMenuOpen) return;
        this.userMenuOpen = false;
        console.log('[header] CLOSE ->', this.userMenuOpen);

        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = undefined;
        }
    }

    logout(evt?: MouseEvent) {
        if (evt) { evt.stopPropagation(); evt.preventDefault(); }
        this.authService.logout();
        this.closeUserMenu();
    }

    ngOnDestroy(): void {
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
        }
    }
}
