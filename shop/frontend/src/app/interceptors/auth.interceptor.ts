import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const PUBLIC_ENDPOINTS = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/resend-verification'
    ];

    if (PUBLIC_ENDPOINTS.some(p => req.url.includes(p))) {
        return next(req);
    }

    const token = auth.token;
    if (!token) return next(req);

    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(req);
};
