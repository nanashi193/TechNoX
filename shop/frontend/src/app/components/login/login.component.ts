import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

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

    get usernameCtrl(): FormControl { return this.form.get('username') as FormControl; }
    get passwordCtrl(): FormControl { return this.form.get('password') as FormControl; }

    constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
        this.form = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            remember: [false],
        });
    }

    onSubmit() {
        this.errorMsg = null;
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        const { username, password, remember } = this.form.value;
        this.loading = true;

        this.auth.login({ username, password })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (res) => {
                    localStorage.setItem('token', res.token);
                    if (remember) localStorage.setItem('rememberUser', username); else localStorage.removeItem('rememberUser');
                    this.router.navigateByUrl('/home');
                },
                error: () => this.errorMsg = 'Sai tên đăng nhập hoặc mật khẩu.'
            });
    }
}
