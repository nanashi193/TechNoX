import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const ownerGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Chưa đăng nhập -> đẩy tới /login và nhớ URL cần quay lại
    if (!auth.isLoggedIn()) {
        return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
    }
    // Có quyền -> cho vào (ADMIN hoặc OWNER)
    if (auth.hasRole('ADMIN') || auth.hasRole('OWNER')) return true;

    // Không đủ quyền -> về trang chủ (hoặc 403 tuỳ bạn)
    return router.createUrlTree(['/home']);
};

