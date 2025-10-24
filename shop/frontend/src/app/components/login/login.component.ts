import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css', '../../styles/shared-styles.css'],
})
export class LoginComponent {
    form: FormGroup;
    loading = false;
    errorMsg: string | null = null;

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    get passwordCtrl(): FormControl {
        return this.form.get('password') as FormControl;
    }

    constructor(private fb: FormBuilder, private router: Router,private route :ActivatedRoute,private auth: AuthService) {
        this.form = this.fb.group({
            email: ['', [
                Validators.required, Validators.email,
                Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            ]], password: ['', [Validators.required, Validators.minLength(8)]],
            remember: [false],
        });
    }

    onSubmit() {
        this.errorMsg = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { email, password, remember } = this.form.value;
        this.loading = true;

        this.auth.login({ email, password })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (res) => {
                    if (remember)
                        localStorage.setItem('rememberUser', email);
                    else
                        localStorage.removeItem('rememberUser');
                    // 1) Nếu có redirect từ guard -> quay lại đúng trang
                    const redirect =
                        this.route.snapshot.queryParamMap.get('redirectTo') ??
                        this.route.snapshot.queryParamMap.get('returnUrl'); // hỗ trợ cả 2 tên

                    if (redirect) { this.router.navigateByUrl(redirect); return; }

                    // 2) Nếu không có redirect: ADMIN/OWNER vào thẳng owner
                    if (this.auth.hasRole('ADMIN') || this.auth.hasRole('OWNER')) {
                        this.router.navigate(['/owner/dashboard']); // chọn route owner bạn muốn
                    } else {
                        this.router.navigate(['/home']);           // user thường
                    }
                },
                error: () => this.errorMsg = 'Sai email hoặc mật khẩu.'
            });
    }
}
