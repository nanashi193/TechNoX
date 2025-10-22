import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Page, Product } from '../models/products.model';
import {MOCK_PRODUCTS} from "../components/owner/products/products.mock";
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class ProductService {
    private http = inject(HttpClient);
    private base = `${environment.apiBaseUrl}/products`;
    private useMock = !!(environment as any).useMock; // true => dùng mock

    search(opts: { q?: string; page?: number; size?: number; sort?: string } = {})
        : Observable<Page<Product>> {
        if (!this.useMock) {
            let params = new HttpParams();
            Object.entries(opts).forEach(([k, v]) => {
                if (v !== undefined && v !== null) params = params.set(k, String(v));
            });
            return this.http.get<Page<Product>>(this.base, {params});
        }

        // MOCK search + paginate
        const page = opts.page ?? 1, size = opts.size ?? 20;
        const q = (opts.q ?? '').toLowerCase();
        const sort = opts.sort ?? ''; // ví dụ: 'price,asc' | 'price,desc'

        let filtered = q
            ? MOCK_PRODUCTS.filter(p => (p.name + p.sku + p.type + (p.description ?? '')).toLowerCase().includes(q))
            : [...MOCK_PRODUCTS];

        if (sort) {
            const [field, dir] = sort.split(',');
            filtered.sort((a: any, b: any) => {
                const va = a[field], vb = b[field];
                return (va > vb ? 1 : va < vb ? -1 : 0) * (dir === 'desc' ? -1 : 1);
            });
        }

        const start = (page - 1) * size;
        const items = filtered.slice(start, start + size);
        return of({items, total: filtered.length, page, size}).pipe(delay(200));
    }

    get(id: number): Observable<Product> {
        if (!this.useMock) return this.http.get<Product>(`${this.base}/${id}`);
        const found = MOCK_PRODUCTS.find(p => p.id === id)!;
        return of(structuredClone(found)).pipe(delay(120));
    }

    create(dto: Partial<Product>): Observable<Product> {
        if (!this.useMock) return this.http.post<Product>(this.base, dto);

        const id = (MOCK_PRODUCTS.at(-1)?.id ?? 0) + 1;
        const now = new Date().toISOString();
        const created: Product = {
            id,
            name: dto.name ?? '',
            type: dto.type ?? '',
            description: dto.description ?? '',
            sku: dto.sku ?? String(id),
            price: dto.price ?? 0,
            variants: dto.variants ?? 0,
            inStock: dto.inStock ?? true,
            stockQty: dto.stockQty ?? 0,
            image: dto.image ?? '',
            createdAt: now,
            updatedAt: now,
        };
        MOCK_PRODUCTS.unshift(created);
        return of(structuredClone(created)).pipe(delay(150));
    }

    update(id: number, dto: Partial<Product>): Observable<Product> {
        if (!this.useMock) return this.http.put<Product>(`${this.base}/${id}`, dto);

        const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
        const updated = {...MOCK_PRODUCTS[idx], ...dto, updatedAt: new Date().toISOString()} as Product;
        MOCK_PRODUCTS[idx] = updated;
        return of(structuredClone(updated)).pipe(delay(150));
    }

    delete(id: number): Observable<void> {
        if (!this.useMock) return this.http.delete<void>(`${this.base}/${id}`);

        const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
        if (idx > -1) MOCK_PRODUCTS.splice(idx, 1);
        return of(void 0).pipe(delay(120));
    }

    setStock(id: number, inStock: boolean): Observable<Product> {
        if (!this.useMock) {
            return this.http.patch<Product>(`${this.base}/${id}/stock`, {inStock});
        }
        const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
        MOCK_PRODUCTS[idx] = {...MOCK_PRODUCTS[idx], inStock, updatedAt: new Date().toISOString()};
        return of(structuredClone(MOCK_PRODUCTS[idx])).pipe(delay(120));
    }

    bulkDelete(ids: number[]): Observable<void> {
        if (!this.useMock) return this.http.post<void>(`${this.base}/bulk-delete`, {ids});

        for (const id of ids) {
            const i = MOCK_PRODUCTS.findIndex(p => p.id === id);
            if (i > -1) MOCK_PRODUCTS.splice(i, 1);
        }
        return of(void 0).pipe(delay(150));
    }
}
