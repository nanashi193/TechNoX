import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

// Hàm helper để kiểm tra token
const checkLoggedIn = (router: Router): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
        //Không có token -> OK, cho phép vào trang login/signup
        return true;
    }
    try {
        const decodedToken: { exp: number } = jwtDecode(token);
        //Kiểm tra token hết hạn
        const isExpired = decodedToken.exp * 1000 < Date.now();
        if (isExpired) {
            localStorage.removeItem('token');
            return true; // Token hết hạn -> Cho phép vào trang login
        }
        //Đã đăng nhập VÀ token còn hạn -> Đá về trang chủ
        router.navigate(['/home']);
        return false;
    } catch (e) {
        //oken không hợp lệ
        localStorage.removeItem('token');
        return true; // Cho phép vào trang login
    }
};
// Đây là guard
export const loginGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    return checkLoggedIn(router);
};