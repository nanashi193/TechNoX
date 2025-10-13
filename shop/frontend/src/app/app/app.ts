import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter, map, startWith } from 'rxjs';
import { SiteHeaderComponent } from '../components/site-header/site-header.component';
import { SiteFooterComponent } from '../components/site-footer/site-footer.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NgIf, SiteHeaderComponent, SiteFooterComponent],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App {
    private router = inject(Router);
    isOwner = signal(false);

    constructor() {
        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                startWith({ urlAfterRedirects: this.router.url } as NavigationEnd),
                map(e => e.urlAfterRedirects.startsWith('/owner'))
            )
            .subscribe(flag => this.isOwner.set(flag));
    }
}
