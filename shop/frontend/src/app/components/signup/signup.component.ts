import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {
    AbstractControl,
    FormBuilder, FormControl,
    FormGroup, FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from "@angular/forms";
import {Router, RouterModule} from "@angular/router";

@Component({
    selector: 'app-signup',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage, FormsModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent {
    form: FormGroup;

    get emailCtrl(): FormControl {
        return this.form.get('email') as FormControl;
    }

    get usernameCtrl(): FormControl {
        return this.form.get('username') as FormControl;
    }

    get passwordCtrl(): FormControl {
        return this.form.get('password') as FormControl;
    }

    constructor(private fb: FormBuilder, private router: Router) {
        this.form = this.fb.group(
            {
                username: ['', [Validators.required, Validators.minLength(3)]],
                email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
                agree: [false, [Validators.requiredTrue]],

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
        if (this.form.invalid) return;
        console.log('Sign up data:', this.form.value);
        this.router.navigateByUrl('/login');
    }
}
