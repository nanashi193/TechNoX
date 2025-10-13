import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface LoginRequest  { email: string; password: string; }
export interface SignupRequest { username: string; email: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
    private baseUrl = 'http://localhost:8080/api/v1/users'; // đổi theo backend

    private currentUserSubject = new BehaviorSubject<any>(this.getUserFromToken());
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {}

    login(body: LoginRequest): Observable<{token: string}> {
        return this.http.post<{token: string}>(`${this.baseUrl}/login`, body);
    }

    signup(body: SignupRequest): Observable<void> {
        // return this.http.post<void>(`${this.baseUrl}/signup`, body);
        return of(void 0).pipe(delay(800)); // MOCK
    }

    forgotPassword(email: string): Observable<void> {
        // return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
        return of(void 0).pipe(delay(800)); // MOCK
    }

    saveToken(token: string) {
        localStorage.setItem('token', token);
        const user = this.decodeToken(token);
        this.currentUserSubject.next(user);
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    private decodeToken(token: string) {
        try {
            return jwtDecode(token);
        } catch {
            return null;
        }
    }

    private getUserFromToken() {
        const token = localStorage.getItem('token');
        return token ? this.decodeToken(token) : null;
    }
}
