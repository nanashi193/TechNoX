import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    AbstractControl, FormBuilder, FormControl, FormGroup,
    Validators, ValidationErrors, ReactiveFormsModule
} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {finalize} from 'rxjs/operators';
import {AuthService} from '../../services/auth.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css', '../../styles/shared-styles.css']
})
export class SignupComponent {
    form: FormGroup;
    loading = false;
    errorMsg: string | null = null;

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    get phoneCtrl() {
        return this.form.get('phone') as FormControl;
    }

    get genderCtrl() {
        return this.form.get('gender') as FormControl;
    }

    get usernameCtrl(): FormControl {
        return this.form.get('username') as FormControl;
    }

    get fullnameCtrl(): FormControl {
        return this.form.get('fullname') as FormControl;
    }

    get passwordCtrl(): FormControl {
        return this.form.get('password') as FormControl;
    }

    constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
        this.form = this.fb.group(
            {
                fullname:['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ỹ\s]+$/)]],
                username: ['', [Validators.required, Validators.minLength(3)]],
                email: ['', [
                    Validators.required, Validators.email,
                    Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
                ]],
                phone: ['', [
                    Validators.required,
                    Validators.pattern(/^(0\d{9,10}|(\+84)\d{9,10})$/)
                ]],
                gender: ['', Validators.required],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
                agree: [false, [Validators.requiredTrue]]
            },
            {validators: this.match('password', 'confirmPassword')}
        );
    }

    match(a: string, b: string) {
        return (group: AbstractControl): ValidationErrors | null => {
            const v1 = group.get(a)?.value;
            const v2 = group.get(b)?.value;
            return v1 && v2 && v1 !== v2 ? {mismatch: true} : null;
        };
    }

    onSubmit() {
        this.errorMsg = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const {username, email, password} = this.form.value;
        this.loading = true;
        this.auth.signup({username, email, password})
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: () => this.router.navigateByUrl('/login'),
                error: (err) => {
                    const code = err?.error?.code;
                    if (code === 'USERNAME_TAKEN') {
                        this.usernameCtrl.setErrors({taken: true});
                        this.usernameCtrl.markAsTouched();
                    } else if (code === 'EMAIL_TAKEN') {
                        this.emailCtrl.setErrors({taken: true});
                        this.emailCtrl.markAsTouched();
                    } else {
                        this.errorMsg = err?.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
                    }
                }
            });
    }
}
