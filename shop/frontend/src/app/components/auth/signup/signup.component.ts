import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    Validators,
    ValidationErrors,
    ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { RegisterDTO } from '../../../dtos/user/register.dto';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css', '../../../styles/shared-styles.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SignupComponent implements OnDestroy {
    form: FormGroup;
    loading = false;
    errorMsg = '';
    signupSuccess = false;
    countdown = 5;
    private timer?: any;
    pendingEmail = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private userService: UserService
    ) {
        this.form = this.fb.group(
            {
                fullname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ỹ\s]+$/)]],
                email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
                phone: ['', [Validators.required, Validators.pattern(/^(0\d{9,10}|(\+84)\d{9,10})$/)]],
                gender: ['', Validators.required],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
                agree: [false, [Validators.requiredTrue]]
            },
            { validators: this.match('password', 'confirmPassword') }
        );
    }

    match(a: string, b: string) {
        return (group: AbstractControl): ValidationErrors | null => {
            const v1 = group.get(a)?.value;
            const v2 = group.get(b)?.value;
            return v1 && v2 && v1 !== v2 ? { mismatch: true } : null;
        };
    }

    get fullnameCtrl() { return this.form.get('fullname') as FormControl; }
    get emailCtrl() { return this.form.get('email') as FormControl; }
    get phoneCtrl() { return this.form.get('phone') as FormControl; }
    get genderCtrl() { return this.form.get('gender') as FormControl; }
    get passwordCtrl() { return this.form.get('password') as FormControl; }

    onSubmit() {
        if (this.form.invalid || this.loading) return;
        this.errorMsg = '';
        this.loading = true;

        const genderValue = this.form.value.gender === 'male';

        const dto = new RegisterDTO({
            FullName: this.form.value.fullname,
            Gender: genderValue,
            email: this.form.value.email,
            PhoneNumber: this.form.value.phone,
            password: this.form.value.password,
            RepeatPassword: this.form.value.confirmPassword,
            RoleId: 3,
            IsActive: true
        });

        this.userService
            .register(dto)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                // truyền email sang handleSuccess
                next: () => this.handleSuccess(this.form.value.email),
                error: (err) => this.handleError(err?.error?.message)
            });
    }

    private handleSuccess(email: string) {
        this.form.disable();
        this.signupSuccess = true;
        this.pendingEmail = email || '';
        if (email) localStorage.setItem('pendingEmail', email);

        // đếm ngược tự chuyển tới trang xác minh
        this.countdown = 7;
        this.timer = setInterval(() => {
            this.countdown--;
            if (this.countdown === 0) this.goVerify();
        }, 1000);
        setTimeout(() => {
            (document.querySelector('.modal-card') as HTMLElement)?.focus?.();
        });
    }

    private handleError(msg?: string) {
        this.signupSuccess = false;
        this.errorMsg = msg || 'Đăng ký thất bại. Vui lòng thử lại.';
    }
    goVerify() {
        if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
        this.router.navigate(['/verify-email/pending'], { queryParams: { email: this.pendingEmail } });
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }
}
