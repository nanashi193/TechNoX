import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, JsonPipe, NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { CartService } from '../../../services/cart.service';

@Component({
    selector: 'app-site-header',
    standalone: true,
    imports: [RouterLink, NgOptimizedImage, AsyncPipe, JsonPipe, RouterLinkActive],
    templateUrl: './site-header.component.html',
    styleUrls: ['./site-header.component.css']
})
export class SiteHeaderComponent {
    mobileMenuOpen = false;
    currentUser$: Observable<any>;
    itemCount$: Observable<number>;

    constructor(
        private cartService: CartService,
        private authService: AuthService
    ) {
        this.currentUser$ = this.authService.currentUser$; // stream user
        this.itemCount$   = this.cartService.itemCount$;   // stream giỏ hàng
    }

    toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu()  { this.mobileMenuOpen = false; }

    logout() {
        this.authService.logout();
    }
}
