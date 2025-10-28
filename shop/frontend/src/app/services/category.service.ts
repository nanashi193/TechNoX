import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private http = inject(HttpClient);
    private base = '/api/v1/categories'; // chỉnh theo BE của bạn

    list(): Observable<Category[]> {
        return this.http.get<any>(this.base).pipe(
            map((res: any) => {
                // Chuẩn hoá: BE có thể trả {id, name} hoặc {categoryId, categoryName} hoặc items[]
                const arr = Array.isArray(res) ? res : (res.items ?? res.categories ?? []);
                return (arr ?? []).map((c: any) => ({
                    id: Number(c.id ?? c.categoryId ?? c.Id),
                    name: c.name ?? c.categoryName ?? c.Name ?? '',
                } as Category));
            })
        );
    }
}
