import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface LoginRequest  { email: string; password: string; }
export interface SignupRequest { username: string; email: string; password: string; }

type JwtPayload = {
    sub?: string;
    exp?: number;                     // UNIX seconds
    role?: string | string[];
    roles?: string[];                 // tuỳ backend
    authorities?: string[];           // Spring Security thường dùng
    scope?: string;                   // "ROLE_USER ROLE_OWNER"...
    [k: string]: any;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private baseUrl = 'http://localhost:8080/api/v1/users'; // đổi theo backend

    private currentUserSubject = new BehaviorSubject<JwtPayload | null>(this.getUserFromToken());
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {}

    // ======  Token helpers ======
    get token(): string | null {
        return localStorage.getItem('token');
    }

    setToken(token: string) {
        localStorage.setItem('token', token);
        this.currentUserSubject.next(this.decodeToken(token));
    }

    clearToken() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    // Đăng nhập (ví dụ backend trả về { token } hoặc { accessToken })
    login(payload: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/login`, payload).pipe(
            tap((res: any) => {
                const token = res?.token ?? res?.accessToken;
                if (token) this.setToken(token);
            })
        );
    }

    // Đăng ký (nếu cần)
    signup(payload: SignupRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/register`, payload);
    }

    // Đăng xuất (xoá token)
    logout() {
        this.clearToken();
    }

    // ====== 🟢 Trạng thái & Quyền ======
    isLoggedIn(): boolean {
        const t = this.token;
        if (!t) return false;
        try {
            const p = this.decodeToken(t);
            // Nếu JWT có exp (giây), kiểm tra hết hạn
            if (p?.exp && typeof p.exp === 'number') {
                return Date.now() < p.exp * 1000;
            }
            // Không có exp thì coi như đã đăng nhập (tuỳ yêu cầu)
            return true;
        } catch {
            return false;
        }
    }

    hasRole(role: string): boolean {
        const p = this.getUserFromToken();
        if (!p) return false;

        // Gom tất cả khả năng đặt tên claim của backend
        let rawRoles: unknown =
            p.roles ?? p.authorities ?? p.role ?? p.scope ?? null;

        // Chuẩn hoá về mảng string
        let roles: string[] = [];
        if (Array.isArray(rawRoles)) {
            roles = rawRoles.map(String);
        } else if (typeof rawRoles === 'string') {
            // scope: 'ROLE_USER ROLE_OWNER' hoặc 'USER,OWNER'
            roles = rawRoles.split(/[,\s]+/).filter(Boolean);
        }

        const needle = role.toUpperCase();
        return roles.map(r => r.toUpperCase()).includes(needle);
    }

    // ====== 🔎 Decode & đọc user từ token ======
    private decodeToken(token: string): JwtPayload | null {
        try {
            return jwtDecode<JwtPayload>(token);
        } catch {
            return null;
        }
    }

    private getUserFromToken(): JwtPayload | null {
        const t = this.token;
        return t ? this.decodeToken(t) : null;
    }
    // ===== Forgot Password =====
    /** Gửi yêu cầu quên mật khẩu (BE sẽ gửi email có link đặt lại mật khẩu) */
    forgotPassword(email: string): Observable<any> {
        // Nhiều BE trả về text/empty -> dùng responseType 'text' để tránh lỗi JSON parse
        return this.http.post(
            `${this.baseUrl}/forgot-password`,
            { email },
            { responseType: 'text' as 'json' }
        );
    }

    /** (Tuỳ chọn) Đặt lại mật khẩu khi người dùng click link từ email và có token */
    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(
            `${this.baseUrl}/reset-password`,
            { token, newPassword },
            { responseType: 'text' as 'json' }
        );
    }
}

