import {Component, OnInit, OnDestroy} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AuthService} from "../../../services/auth.service";

@Component({
    selector: 'owner-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './owner-layout.component.html',
    styleUrls: ['./owner-layout.component.css']
})
export class OwnerLayoutComponent {
    constructor(private auth: AuthService) {
    }

    onLogout() {
        this.auth.clearToken();
        location.href = '/login';
    }
    ngOnInit(){ document.body.classList.add('owner-scope'); }
    ngOnDestroy(){ document.body.classList.remove('owner-scope'); }
}
