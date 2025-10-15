import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-site-header',
    standalone: true,
    imports: [RouterLink, NgOptimizedImage, AsyncPipe],
    templateUrl: './site-header.component.html',
    styleUrls: ['./site-header.component.css']
})
export class SiteHeaderComponent {
    mobileMenuOpen = false;
    currentUser$: Observable<any>;

    constructor(private authService: AuthService) {
        this.currentUser$ = this.authService.currentUser$; // 🟢 Gán observable user
    }

    toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu()  { this.mobileMenuOpen = false; }

    logout() {
        this.authService.logout();
    }
}
