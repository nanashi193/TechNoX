import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter, startWith } from 'rxjs';

import { SiteHeaderComponent } from '../components/Component-function/site-header/site-header.component';
import { SiteFooterComponent } from '../components/Component-function/site-footer/site-footer.component';
import { ToastContainerComponent } from '../shared/toast/toast-container.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        NgIf,
        SiteHeaderComponent,
        SiteFooterComponent,
        ToastContainerComponent,   // ⬅️ gắn toast container vào imports
    ],
    templateUrl: './app.html',
    // dùng styles.css/global nên không cần styleUrls
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
        // tìm route hiện tại sâu nhất
        let r: ActivatedRoute = this.route;
        while (r.firstChild) r = r.firstChild;

        // kiểm tra data.hideChrome ở bất kỳ cấp nào
        let cur: ActivatedRoute | null = r;
        let hide = false;
        while (cur) {
            if (cur.snapshot.data['hideChrome']) { hide = true; break; }
            cur = cur.parent!;
        }
        this.showChrome.set(!hide);
    }
}
