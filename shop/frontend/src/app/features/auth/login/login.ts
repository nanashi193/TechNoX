import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.html',
    styleUrls: ['./login.css'],
    imports: [CommonModule, FormsModule, NgOptimizedImage, RouterLink] // ❗️Không cần RouterLink nữa
})
export class LoginComponent {
    model = {username: '', password: '', remember: false};
    isSubmitting = false;

    constructor(private router: Router) {
    }

    onSubmit() {
        if (!this.model.username || !this.model.password) {
            alert('Vui lòng nhập đủ Username và Password');
            return;
        }
        this.isSubmitting = true;
        setTimeout(() => {
            this.isSubmitting = false;
            if (this.model.remember) {
                localStorage.setItem('rememberUser', this.model.username);
            } else {
                localStorage.removeItem('rememberUser');
            }
            this.router.navigateByUrl('/'); // trang chính sau đăng nhập
        }, 500);
    }
}
