import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
    standalone: true,
    selector: 'app-verify-email',
    imports: [CommonModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrls: ['../../styles/shared-styles.css']
})
export class VerifyEmailComponent {
    private route = inject(ActivatedRoute);
    private auth = inject(AuthService);
    private router = inject(Router);

    loading = true;
    successMsg: string | null = null;
    errorMsg: string | null = null;

    ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.loading = false;
            this.errorMsg = 'Liên kết xác minh không hợp lệ.';
            return;
        }
        this.auth.verifyEmail(token)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: () => {
                    this.successMsg = 'Email của bạn đã được xác minh. Bạn có thể đăng nhập.';
                    setTimeout(() => this.router.navigateByUrl('/login'), 1200);
                },
                error: () => {
                    this.errorMsg = 'Không thể xác minh email. Liên kết có thể đã hết hạn.';
                }
            });
    }
}
