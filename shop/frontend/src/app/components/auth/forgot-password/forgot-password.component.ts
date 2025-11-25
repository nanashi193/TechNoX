import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from "../../../services/auth.service";
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css', '../../../styles/shared-styles.css']
})
export class ForgotPasswordComponent {
    form: FormGroup;
    loading = false;
    successMsg: string | null = null;
    errorMsg: string | null = null;

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private forgotSvc: AuthService
    ) {

        this.form = this.fb.group({
            email: ['', [
                Validators.required,
                Validators.email,
                Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            ]]
        });
    }

    onSubmit() {
        this.successMsg = this.errorMsg = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const email = this.emailCtrl.value;

        this.forgotSvc.forgotPassword(email)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: () => {
                    this.successMsg = 'Sau khi kiểm tra, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.';
                    this.form.reset();
                },
                error: () => {
                    this.successMsg = 'Sau khi kiểm tra, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.';
                }
            });
    }
}
