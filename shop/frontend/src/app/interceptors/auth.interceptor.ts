import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const apiBaseUrl = environment.apiBaseUrl;

    let r = req;

    if (apiBaseUrl && req.url.startsWith(apiBaseUrl) && apiBaseUrl.includes('ngrok-free.app')) {
        r = r.clone({ setHeaders: { 'ngrok-skip-browser-warning': 'true' } });
    }

    const path = (() => {
        try { return new URL(req.url, window.location.origin).pathname; }
        catch { return req.url; }
    })();
    if (req.method === 'OPTIONS') return next(r);

    const isPublicPOST =
        req.method === 'POST' && [
            `${apiBaseUrl}/users/login`,
            `${apiBaseUrl}/users/register`,
            `${apiBaseUrl}/users/forgot-password`,
            `${apiBaseUrl}/users/reset-password`,
            `${apiBaseUrl}/users/resend-verification`,
            `${apiBaseUrl}/bills/pay/webhook`,
        ].some(p => path.startsWith(p));

    const isPublicGET =
        req.method === 'GET' && [
            `${apiBaseUrl}/users/verify-email`,
            `${apiBaseUrl}/categories`,
            `${apiBaseUrl}/customer/products`,
        ].some(p => path.startsWith(p));


    if (isPublicPOST || isPublicGET) {
        return next(r);
    }

    const token = auth.token;
    if (token) {
        r = r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next(r);
};