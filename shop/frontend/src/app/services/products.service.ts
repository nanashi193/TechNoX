import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Page, Product } from '../models/products.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private http = inject(HttpClient);
    private base = `${environment.apiBaseUrl}/products`;

    list(opts: { page?: number; size?: number; q?: string; sort?: string } = {}): Observable<Page<Product>> {
        let params = new HttpParams()
            .set('page', String(opts.page ?? 0))
            .set('size', String(opts.size ?? 10));
        if (opts.q) params = params.set('q', opts.q);
        if (opts.sort) params = params.set('sort', opts.sort);
        return this.http.get<Page<Product>>(this.base, { params });
    }
    get(id: number) { return this.http.get<Product>(`${this.base}/${id}`); }
    create(dto: Partial<Product>) { return this.http.post<Product>(this.base, dto); }
    update(id: number, dto: Partial<Product>) { return this.http.put<Product>(`${this.base}/${id}`, dto); }
    remove(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}
