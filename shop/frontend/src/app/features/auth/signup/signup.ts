import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from "@angular/forms";
import {Router, RouterModule} from "@angular/router";

@Component({
    selector: 'app-signup',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
    templateUrl: './signup.html',
    styleUrl: './signup.css'
})
export class SignupComponent {
    form!: FormGroup;
    constructor(private fb: FormBuilder, private router: Router) {
        this.form = this.fb.group(
            {
                username: ['', [Validators.required, Validators.minLength(3)]],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', [Validators.required]]
            },
            {validators: this.match('password', 'confirm')}
        );
    }
        match(a: string, b: string){
            return  (group: AbstractControl): ValidationErrors | null =>{
                const v1 = group.get(a)?.value;
                const v2 = group.get(b)?.value;
                return v1 && v2 && v1 !== v2 ? {mismatch:true}:null;
            };
        }
        onSubmit(){
            if(this.form.invalid) return;
            console.log('Sign up data:', this.form.value);
            this.router.navigateByUrl('/login');
        }
}
