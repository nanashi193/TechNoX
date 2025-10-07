import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-site-header',
    standalone: true,
    imports: [RouterLink, NgOptimizedImage],
    templateUrl: './site-header.component.html',
    styleUrls: ['./site-header.component.css']
})
export class SiteHeaderComponent {
    mobileMenuOpen = false;
    toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
    closeMenu()  { this.mobileMenuOpen = false; }
}
