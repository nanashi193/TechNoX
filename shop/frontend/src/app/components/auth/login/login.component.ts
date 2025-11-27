import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import {finalize} from 'rxjs/operators';

type Me = { id: number | string; name: string; email: string; role?: string; avatar?: string };

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css', '../../../styles/shared-styles.css'],
})
export class LoginComponent {
    form: FormGroup;
    loading = false;
    errorMsg: string | null = null;

    get emailCtrl(): FormControl { return this.form.get('email') as FormControl; }
    get passwordCtrl(): FormControl { return this.form.get('password') as FormControl; }

    constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email,
                Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            remember: [false],
        });
    }

    onSubmit() {
        this.errorMsg = null;
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        const { email, password, remember } = this.form.value;
        this.loading = true;

        this.auth.login({ email, password })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (res: any) => {
                    const token = res?.token;
                    if (!token) { this.errorMsg = 'Lỗi đăng nhập: Không nhận được token.'; return; }

                    localStorage.setItem('auth.token', token);
                    localStorage.setItem('auth.remember', String(!!remember));

                    this.auth.me().subscribe({
                        next: (me: Me) => {
                            localStorage.setItem('auth.user', JSON.stringify(me));
                            const role = (me.role ?? '').toUpperCase();
                            if (role === 'ADMIN' || role === 'OWNER' || role === 'STAFF') this.router.navigate(['/owner']);
                            // else if (role === 'STAFF') {
                            //     this.router.navigate(['/staff/assign-orders']);
                            // }
                            else if (role === 'SHIPPING_STAFF') {
                                this.router.navigate(['/staff/shipping']);
                            }

                            else this.router.navigate(['/home']);
                        },
                        error: _ => {
                            this.errorMsg = 'Không lấy được hồ sơ người dùng.';
                            this.router.navigate(['/home']);
                        }
                    });
                },
                error: () => this.errorMsg = 'Sai email hoặc mật khẩu.',
            });
    }
}
