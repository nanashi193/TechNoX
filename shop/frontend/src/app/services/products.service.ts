import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Page, Product } from '../models/products.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private http = inject(HttpClient);
    private base = `${environment.apiBaseUrl}/products`;

    search(opts: { q?: string; page?: number; size?: number; sort?: string } = {})
        : Observable<Page<Product>> {
        let params = new HttpParams();
        Object.entries(opts).forEach(([k, v]) => { if (v !== undefined && v !== null) params = params.set(k, String(v)); });
        return this.http.get<Page<Product>>(this.base, { params });
    }

    get(id: number)        { return this.http.get<Product>(`${this.base}/${id}`); }
    create(dto: Partial<Product>)  { return this.http.post<Product>(this.base, dto); }
    update(id: number, dto: Partial<Product>) { return this.http.put<Product>(`${this.base}/${id}`, dto); }
    delete(id: number)     { return this.http.delete<void>(`${this.base}/${id}`); }

    // PATCH chỉ trường inStock
    setStock(id: number, inStock: boolean) {
        return this.http.patch<Product>(`${this.base}/${id}/stock`, { inStock });
    }

    // Bulk actions
    bulkDelete(ids: number[]) {
        return this.http.post<void>(`${this.base}/bulk-delete`, { ids });
    }
    bulkPublish(ids: number[]) {
        return this.http.post<void>(`${this.base}/bulk-publish`, { ids });
    }
    bulkUnpublish(ids: number[]) {
        return this.http.post<void>(`${this.base}/bulk-unpublish`, { ids });
    }
}
