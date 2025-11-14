import {Component, OnInit, OnDestroy, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AuthService} from "../../../../services/auth.service";
import { NotificationService, NotificationDTO } from '../../../../services/notification.service';
import {ToastNotificationComponent} from "../../../Component-Noti/toast-notification.component";

@Component({
    selector: 'owner-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, RouterModule, ToastNotificationComponent],
    templateUrl: './owner-layout.component.html',
    styleUrls: ['./owner-layout.component.css', '../owner-shared.css']
})

export class OwnerLayoutComponent implements OnInit, OnDestroy {
    private notificationService = inject(NotificationService);
    currentNotification: NotificationDTO | null = null;
    constructor() {}
    private router = inject(Router);
    private auth = inject(AuthService);
    me$ = this.auth.profile$;

    mini = false;                   // thu gọn sidebar
    open = { dash: true };
    // mở Dashboard
    create(){ this.router.navigate(['/owner/products', 'new']); }

    onLogout() {
        this.auth.clearToken();
        location.href = '/login';
    }
    ngOnInit(){
        document.body.classList.add('owner-scope');

        // --- BẮT ĐẦU CODE THÊM VÀO ---
        // 1. Kết nối WebSocket khi vào layout
        this.notificationService.connect();

        // 2. Lắng nghe thông báo đẩy về từ service
        this.notificationService.notificationSubject.subscribe(notification => {
            this.currentNotification = notification;

            // Tự động ẩn thông báo sau 10 giây (hoặc tùy bạn)
            setTimeout(() => this.closeToast(), 10000);
        });
        // --- KẾT THÚC CODE THÊM VÀO ---
    }
    ngOnDestroy(){
        document.body.classList.remove('owner-scope');

        // --- BẮT ĐẦU CODE THÊM VÀO ---
        // Ngắt kết nối WebSocket khi rời khỏi layout
        this.notificationService.disconnect();
        // --- KẾT THÚC CODE THÊM VÀO ---
    }
    closeToast() {
        this.currentNotification = null;
    }
}
