import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const apiBaseUrl = environment.apiBaseUrl;
    let modifiedReq = req;
    if (apiBaseUrl && req.url.startsWith(apiBaseUrl) && apiBaseUrl.includes('ngrok-free.app')) {
        modifiedReq = modifiedReq.clone({
            setHeaders: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
    }
    const PUBLIC_ENDPOINTS = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/resend-verification',
        '/customer/products',
        '/products'
    ];

    const isPublic = PUBLIC_ENDPOINTS.some(p => req.url.includes(p));
    console.log(`[Interceptor] Request URL: ${req.url}`);
    console.log(`[Interceptor] Is Public: ${isPublic}`);
    if (isPublic) {
        return next(modifiedReq);
    }

    const token = auth.token;
    console.log(`[Interceptor] Token from AuthService:`, token);
    if (!token) {
        return next(modifiedReq);
    }

    modifiedReq = modifiedReq.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(modifiedReq);
};
