import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from '../models/user.model';

export type Page<T> = { items: T[]; total: number; };

@Injectable({ providedIn: 'root' })
export class OwnerUsersService {
    private base = `${environment.apiBaseUrl}/users`;

    constructor(private http: HttpClient) {}

    private headers(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    // ------ MOCK ------
    private users: User[] = Array.from({length: 53}, (_,i)=>({
        id: i+1,
        name: ['An','Bình','Chi','Duy','Giang','Hà','Khánh','Lam','Minh','Ngân'][i%10] + ' ' + (100+i),
        email: `user${i+1}@mail.com`,
        phone: '09' + String(10000000 + i),
        isActive: i%4 !== 0,
        ordersCount: (i*7)%25,
        totalSpent: ((i*73521)%5_000_000),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    search(opts: { q?: string; page?: number; size?: number; sort?: string; isActive?: boolean } = {}): Observable<Page<User>> {
        let params = new HttpParams();
        Object.entries(opts).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
        });
        return this.http.get<Page<User>>(this.base, { params, headers: this.headers() });
    }

    get(id: number) {
        return this.http.get<User>(`${this.base}/${id}`, { headers: this.headers() });
    }

    create(dto: Partial<User>) {
        return this.http.post<User>(this.base, dto, { headers: this.headers() });
    }

    update(id: number, dto: Partial<User>) {
        return this.http.put<User>(`${this.base}/${id}`, dto, { headers: this.headers() });
    }

    delete(id: number) {
        return this.http.delete<void>(`${this.base}/${id}`, { headers: this.headers() });
    }

    toggleActive(id: number, isActive: boolean) {
        return this.http.patch<User>(`${this.base}/${id}/active`, { isActive }, { headers: this.headers() });
    }
}
