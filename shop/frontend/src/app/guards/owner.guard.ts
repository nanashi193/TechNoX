import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
    roleName: string;
    exp: number;
}
// Hàm helper để kiểm tra token
const checkOwnerRole = (router: Router): boolean => {
    const token = localStorage.getItem('token');

    if (!token) {
        //Không có token -> Đá về trang đăng nhập
        router.navigate(['/login']);
        return false;
    }
    try {
        const decodedToken: TokenPayload = jwtDecode(token);
        //Kiểm tra token hết hạn
        const isExpired = decodedToken.exp * 1000 < Date.now();
        if (isExpired) {
            localStorage.removeItem('token');
            router.navigate(['/login']);
            return false;
        }
        //Kiểm tra vai trò
        const role = decodedToken.roleName.toUpperCase();
        if (role === 'ADMIN' || role === 'OWNER') {
            return true; // OK, cho phép truy cập
        } else {
            //Đã đăng nhập nhưng sai vai trò -> Đá về trang chủ
            router.navigate(['/home']);
            return false;
        }
    } catch (e) {
        //Token không hợp lệ
        console.error("Lỗi giải mã token:", e);
        localStorage.removeItem('token');
        router.navigate(['/login']);
        return false;
    }
};
// Đây là guard
export const ownerGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    return checkOwnerRole(router);
};