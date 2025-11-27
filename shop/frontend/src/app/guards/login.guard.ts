import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

const checkLoggedIn = (router: Router): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
        return true;
    }
    try {
        const decodedToken: { exp: number } = jwtDecode(token);
        const isExpired = decodedToken.exp * 1000 < Date.now();
        if (isExpired) {
            localStorage.removeItem('token');
            return true;
        }
        router.navigate(['/home']);
        return false;
    } catch (e) {
        //token không hợp lệ
        localStorage.removeItem('token');
        return true;
    }
};
export const loginGuard: CanActivateFn = () => {
    const router = inject(Router);
    return checkLoggedIn(router);
};