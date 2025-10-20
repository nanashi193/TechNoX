import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import {Observable, of, delay, throwError} from 'rxjs';
import { environment } from '../environments/environment';
import { User, UserDetail, Address } from '../models/user.model';

export type Page<T> = { items: T[]; total: number; };

@Injectable({ providedIn: 'root' })
export class OwnerUsersService {
    private base = `${environment.apiBaseUrl}/users`;
    private useMock = true;  //noi BE, doi thanh false.

    private detailCache = new Map<number, UserDetail>();

    private fakeAddress(seed: number): Address {
        const cities = ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'];
        const city = cities[seed % cities.length];
        return {
            line1: `${45 + (seed % 40)} Roker Terrace`,
            line2: 'Latheronwheel',
            city,
            postalCode: `KW5 ${800 + (seed % 100)}W`,
            country: 'UK'
        };
    }

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

    // ------MOCK ------
    private searchLocal(opts: { q?: string; page?: number; size?: number; sort?: string; isActive?: boolean }): Page<User> {
        let list = [...this.users];

        const q = (opts.q ?? '').trim().toLowerCase();
        if (q) {
            list = list.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.phone ?? '').toLowerCase().includes(q)
            );
        }
        if (opts.isActive !== undefined) {
            list = list.filter(u => u.isActive === opts.isActive);
        }
        if (opts.sort) {
            const [field, dir] = opts.sort.split(',') as [keyof User, 'asc' | 'desc'];
            list.sort((a:any,b:any) => {
                const av = a[field] ?? '', bv = b[field] ?? '';
                const cmp = (typeof av==='number' && typeof bv==='number')
                    ? av - bv
                    : String(av).localeCompare(String(bv), undefined, { numeric:true, sensitivity:'base' });
                return dir === 'asc' ? cmp : -cmp;
            });
        }
        const page = opts.page ?? 1, size = opts.size ?? 20;
        const start = (page-1)*size;
        return { items: list.slice(start, start+size), total: list.length };
    }

    // ===== public =====
    search(opts: { q?: string; page?: number; size?: number; sort?: string; isActive?: boolean } = {}): Observable<Page<User>> {
        if (this.useMock) {
            return of(this.searchLocal(opts)).pipe(delay(120));
        }
        let params = new HttpParams();
        Object.entries(opts).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
        });
        return this.http.get<Page<User>>(this.base, { params, headers: this.headers() });
    }

    get(id: number) {
        if (this.useMock) {
            return of(this.users.find(u => u.id === id)!).pipe(delay(80));
        }
        return this.http.get<User>(`${this.base}/${id}`, { headers: this.headers() });
    }
    getDetail(id: number): Observable<UserDetail> {
        if (this.useMock) {
            const base = this.users.find(u => u.id === id);
            if (!base) return throwError(() => new Error('Not found'));

            const detail: UserDetail = {
                ...base,
                shippingAddress: this.fakeAddress(id),
                billingAddress: this.fakeAddress(id + 1),
                maskedCard: `************${(4200 + id).toString().slice(-4)}`
            };
            return of(detail).pipe(delay(80));
        }
        return this.http.get<UserDetail>(`${this.base}/${id}`, { headers: this.headers() });
    }


    create(dto: Partial<User>) {
        if (this.useMock) {
            const id = (this.users.at(-1)?.id ?? 0) + 1;
            const u: User = {
                id, name: '', email: '', isActive: true, ordersCount: 0, totalSpent: 0,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                ...dto
            } as User;
            this.users.unshift(u);
            return of(u).pipe(delay(80));
        }
        return this.http.post<User>(this.base, dto, { headers: this.headers() });
    }

    update(id: number, dto: Partial<User>) {
        if (this.useMock) {
            const i = this.users.findIndex(u => u.id === id);
            this.users[i] = { ...this.users[i], ...dto, updatedAt: new Date().toISOString() };
            return of(this.users[i]).pipe(delay(80));
        }
        return this.http.put<User>(`${this.base}/${id}`, dto, { headers: this.headers() });
    }

    delete(id: number) {
        if (this.useMock) {
            this.users = this.users.filter(u => u.id !== id);
            return of(void 0).pipe(delay(60));
        }
        return this.http.delete<void>(`${this.base}/${id}`, { headers: this.headers() });
    }

    toggleActive(id: number, isActive: boolean) {
        if (this.useMock) {
            return this.update(id, { isActive });
        }
        return this.http.patch<User>(`${this.base}/${id}/active`, { isActive }, { headers: this.headers() });
    }
}
