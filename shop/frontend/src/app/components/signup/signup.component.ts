import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
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
    styleUrls: ['./signup.component.css', '../../styles/shared-styles.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SignupComponent {
    form: FormGroup;
    loading = false;
    errorMsg = '';
    signupSuccess = false;
    countdown = 5;
    private timer?: any;

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    get phoneCtrl() {
        return this.form.get('phone') as FormControl;
    }

    get genderCtrl() {
        return this.form.get('gender') as FormControl;
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
                fullname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ỹ\s]+$/)]],
                email: ['', [
                    Validators.required,
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
        if (this.form.invalid || this.loading) return;
        this.errorMsg = '';
        this.loading = true;

        // co api thi dung
        // this.auth.signup(this.form.value)
        //     .pipe(finalize(() => this.loading = false))
        //     .subscribe({
        //         next: () => this.handleSuccess(),
        //         error: (err) => this.handleError(err?.error?.message)
        //         });

        setTimeout(() => this.handleSuccess(), 400);

    }
    goLoginNow() {
        if (this.timer) clearInterval(this.timer);
        this.router.navigate(['/login']);
    }

    private handleSuccess() {
        this.form.disable();
        this.loading = false;
        this.signupSuccess = true;
        this.countdown = 7;

        setTimeout(() => {
            document.querySelector('.modal-card')?.scrollIntoView({behavior:'smooth', block:'center'});
            (document.querySelector('.modal-card .primary-btn') as HTMLButtonElement)?.focus?.();
        });

        this.timer = setInterval(() => {
            this.countdown--;
            if (this.countdown === 0) {
                clearInterval(this.timer);
                this.router.navigate(['/login']);
            }
        }, 1000);
    }

    private handleError(msg?: string) {
        this.loading = false;
        this.signupSuccess = false;
        this.errorMsg = msg || 'Đăng kí thất bại. Vui lòng thử lại.';
    }


    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }
}
