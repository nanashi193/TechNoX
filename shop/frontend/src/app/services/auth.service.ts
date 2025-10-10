import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface LoginRequest  { username: string; password: string; }
export interface SignupRequest { username: string; email: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
    private baseUrl = '/api/auth'; // doi theo backend

    constructor(private http: HttpClient) {}

    login(body: LoginRequest): Observable<{token: string}> {
        //co backend thi dung
        // return this.http.post<{token:string}>(`${this.baseUrl}/login`, body);
        return of({ token: 'fake-jwt' }).pipe(delay(800)); // MOCK
    }

    signup(body: SignupRequest): Observable<void> {
        // return this.http.post<void>(`${this.baseUrl}/signup`, body);
        return of(void 0).pipe(delay(800)); // MOCK
    }

    forgotPassword(email: string): Observable<void> {
        // return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
        return of(void 0).pipe(delay(800)); // MOCK
    }

    // --------
    get token(): string | null {
        return localStorage.getItem('access_token');
    }

    setToken(token: string) {
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        localStorage.removeItem('access_token');
    }

    getCurrentUser(): any {
        const token = this.token;
        if (!token || !token.includes('.')) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload; // { sub, email, roles, exp, ... }
        } catch {
            return null;
        }
    }

    hasRole(role: string): boolean {
        const user = this.getCurrentUser();
        return user?.roles?.includes(role);
    }

    isLoggedIn(): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.exp && Date.now() / 1000 > user.exp) return false;
        return true;
    }
}
