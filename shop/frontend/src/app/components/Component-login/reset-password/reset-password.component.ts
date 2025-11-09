import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; // Import thêm AbstractControl, ValidationErrors
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css', '../../../styles/shared-styles.css']
})
export class ResetPasswordComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private authSvc = inject(AuthService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    token: string | null = null;
    form: FormGroup;

    loading = false;
    successMsg: string | null = null;
    errorMsg: string | null = null;

    get newPasswordCtrl() { return this.form.get('newPassword'); }
    get confirmPasswordCtrl() { return this.form.get('confirmPassword'); }

    constructor() {
        this.form = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordsMatchValidator });
    }

    ngOnInit(): void {
        this.token = this.route.snapshot.queryParamMap.get('token');
        if (!this.token) {
            this.errorMsg = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";
            this.form.disable();
        }
    }

    onSubmit() {
        this.errorMsg = this.successMsg = null;
        if (this.form.invalid || !this.token) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;

        const newPassword = this.newPasswordCtrl!.value;

        this.authSvc.resetPassword(this.token, newPassword)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (message) => {
                    this.successMsg = message || "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.";
                    this.form.disable();
                    setTimeout(() => this.router.navigate(['/login']), 6000);
                },
                error: (err) => {
                    this.errorMsg = err?.error || "Token không hợp lệ, đã hết hạn hoặc có lỗi xảy ra.";
                }
            });
    }

    private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('newPassword')?.value;
        const confirm = control.get('confirmPassword')?.value;
        return password && confirm && password !== confirm ? { mismatch: true } : null;
    }
}