import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter, startWith } from 'rxjs';
import { SiteHeaderComponent } from '../components/Component-function/site-header/site-header.component';
import { SiteFooterComponent } from '../components/Component-function/site-footer/site-footer.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NgIf, SiteHeaderComponent, SiteFooterComponent],
    templateUrl: './app.html',
    // không cần styleUrls, ta dùng styles.css global
})
export class App {
    private router = inject(Router);
    private route  = inject(ActivatedRoute);
    showChrome = signal(true);

    constructor() {
        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                startWith({ urlAfterRedirects: this.router.url } as NavigationEnd)
            )
            .subscribe(() => this.updateChrome());
    }

    private updateChrome() {
        let r: ActivatedRoute = this.route;
        while (r.firstChild) r = r.firstChild;

        let cur: ActivatedRoute | null = r;
        let hide = false;
        while (cur) {
            if (cur.snapshot.data['hideChrome']) { hide = true; break; }
            cur = cur.parent!;
        }
        this.showChrome.set(!hide);
    }
}
