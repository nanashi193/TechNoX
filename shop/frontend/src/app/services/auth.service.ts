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
}
