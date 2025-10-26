import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {Page, Product} from '../models/products.model';
import {MOCK_PRODUCTS} from "../components/owner/products/products.mock";
import {of} from 'rxjs';
import {delay} from 'rxjs/operators';
import {map} from 'rxjs/operators';

export interface ProductListResponse {
    products: Product[];
    totalPages: number; // từ BE
}
type RawVariant = { sku?: string; code?: string; quantity?: number; qty?: number; stock?: number };

type RawProduct = {
    id?: number;
    name: string;
    price: number | string;
    thumbnail?: string;
    imageUrl?: string;
    description?: string;
    status?: boolean;

    variants?: RawVariant[] | number | null;
    variantsCount?: number;

    createdAt?: string;  CreatedAt?: string;
    categoryName?: string;
    category?: { id: number; name: string };
    CategoryId?: number;

    sku?: string;
    code?: string;
    productCode?: string;

    stockQty?: number;
    quantity?: number;
    totalQuantity?: number;
};
type ProductListResponseBE = { products: RawProduct[]; totalPages: number };


@Injectable({providedIn: 'root'})
export class ProductService {
    private http = inject(HttpClient);
    private base = `${environment.apiBaseUrl}/products`;
    private useMock = !!(environment as any).useMock; // true => dùng mock

    search({ page = 1, size = 8 } = {}) {
        const page0 = Math.max(0, page - 1);
        const params = new HttpParams().set('page', page0).set('limit', size);
        const toNum = (v: any) => (v == null ? 0 : Number(v));

        return this.http.get<ProductListResponseBE>(this.base, { params }).pipe(
            map(res => {
                const raw: RawProduct[] = res.products ?? [];
                const items: Product[] = raw.map(p => {
                    // 1) số biến thể: nhận cả number lẫn array
                    const variantsCount =
                        typeof p.variants === 'number'
                            ? p.variants
                            : Array.isArray(p.variants)
                                ? p.variants.length
                                : (p.variantsCount ?? 0);

                    // 2) tổng tồn kho: nếu có mảng biến thể thì cộng, nếu không lấy field tổng
                    const stockQty = Array.isArray(p.variants)
                        ? p.variants.reduce((s, v) => s + toNum(v.quantity ?? v.qty ?? v.stock), 0)
                        : toNum(p.totalQuantity ?? p.quantity ?? p.stockQty);

                    // 3) SKU: ưu tiên product-level; nếu không có thì lấy ở biến thể đầu
                    const sku =
                        p.sku ?? p.code ?? p.productCode ??
                        (Array.isArray(p.variants) && p.variants[0]
                            ? (p.variants[0].sku ?? p.variants[0].code ?? '')
                            : '');

                    // 4) Loại: name nếu có, không thì hiển thị #ID cho đỡ trống
                    const type =
                        p.categoryName ?? p.category?.name ?? (p.CategoryId != null ? `#${p.CategoryId}` : '');

                    return {
                        id: p.id ?? 0,
                        name: p.name,
                        image: p.thumbnail ?? p.imageUrl ?? '',
                        type,
                        sku,
                        price: Number(p.price ?? 0),
                        variants: variantsCount,
                        stockQty,
                        inStock: p.status ?? stockQty > 0,
                        description: p.description ?? '',
                        createdAt: (p as any).createdAt ?? (p as any).CreatedAt ?? ''
                    } as Product;
                });

                return { items, total: (res.totalPages ?? 0) * size, page, size };
            })
        )}

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
