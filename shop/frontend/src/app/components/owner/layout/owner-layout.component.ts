import {Component, OnInit, OnDestroy, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AuthService} from "../../../services/auth.service";

@Component({
    selector: 'owner-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './owner-layout.component.html',
    styleUrls: ['./owner-layout.component.css', '../../owner/owner-shared.css']
})

export class OwnerLayoutComponent {
    constructor(private auth: AuthService) {
    }
    private router = inject(Router);

    mini = false;                   // thu gọn sidebar
    open = { dash: true };
    // mở Dashboard
    create(){ this.router.navigate(['/owner/products', 'new']); }

    onLogout() {
        this.auth.clearToken();
        location.href = '/login';
    }
    ngOnInit(){ document.body.classList.add('owner-scope'); }
    ngOnDestroy(){ document.body.classList.remove('owner-scope'); }
}
