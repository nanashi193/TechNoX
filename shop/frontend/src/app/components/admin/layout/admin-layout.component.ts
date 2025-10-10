import {Component, OnInit, OnDestroy} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AuthService} from "../../../services/auth.service";

@Component({
    selector: 'admin-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.css']
})
export class AdminLayout {
    constructor(private auth: AuthService) {
    }

    onLogout() {
        this.auth.clearToken();
        location.href = '/login';
    }
    ngOnInit(){ document.body.classList.add('admin-scope'); }
    ngOnDestroy(){ document.body.classList.remove('admin-scope'); }
}
