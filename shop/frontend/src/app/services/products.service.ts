import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {Page, Product, ProductVariant} from '../models/products.model';
import {of} from 'rxjs';
import {delay} from 'rxjs/operators';
import {map} from 'rxjs/operators';
import {ProductCreateDTO, ProductUpdateDTO} from "../dtos/products/products.dto";
import {ProductImage, ProductImageBE} from "../models/product-image.model";

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
    private readonly UPLOAD_URL = `${this.base}/images/upload`;     // ⬅️ chỉnh cho khớp BE
    private readonly ATTACH_URL = (id: number) => `${this.base}/${id}/images`;
    private useMock = !!(environment as any).useMock; // true => dùng mock
    private toNum = (v: any) => (v == null ? 0 : Number(v));

    private mapRawProduct(p: any): Product {
        const toNum = this.toNum;

        const variantsArr: ProductVariant[] = Array.isArray(p?.variants)
            ? (p.variants as any[]).map(v => ({
                id: v.id,
                color: v.color ?? '',
                size: v.size ?? '',
                quantity: toNum(v.quantity ?? v.qty ?? v.stock),
                price: toNum(v.price ?? 0),
                sku: v.sku ?? v.code ?? '',
            }))
            : [];

        const stockQty = variantsArr.length
            ? variantsArr.reduce((s, v) => s + toNum(v.quantity), 0)
            : toNum(p?.totalQuantity ?? p?.quantity ?? p?.stockQty);

        return {
            id: Number(p?.id ?? p?.Id ?? p?.productId ?? 0),
            name: p?.name ?? p?.productName ?? '',
            image: p?.thumbnail ?? p?.imageUrl ?? '',     // FE vẫn dùng 'image' cho thumbnail
            thumbnail: p?.thumbnail ?? p?.imageUrl ?? '',
            type: p?.categoryName ?? p?.category?.name ?? (p?.CategoryId != null ? `#${p?.CategoryId}` : ''),
            sku: p?.sku ?? p?.code ?? '',
            price: toNum(p?.price ?? 0),
            variants: variantsArr,                         // ⟵ mảng
            variantCount: variantsArr.length ?? this.toNum(p?.variants ?? p?.variantCount ?? 0),
            stockQty,
            inStock: Boolean(p?.status ?? stockQty > 0),
            description: p?.description ?? '',
            createdAt: p?.createdAt ?? p?.createAt ?? p?.CreatedAt ?? '',
            categoryId: p?.categoryId ?? p?.CategoryId,
            categoryName: p?.categoryName ?? p?.category?.name,
        } as Product;
    }

    search({ page = 1, size = 8 } = {}) {
        const page0 = Math.max(0, page - 1);
        const params = new HttpParams().set('page', String(page0)).set('limit', String(size));
        const toNum = (v: any) => (v == null ? 0 : Number(v));

        return this.http.get<ProductListResponseBE>(this.base, { params }).pipe(
            map(res => {
                const raw: RawProduct[] = res.products ?? [];
                const items: Product[] = raw.map(p => {
                    const variantsArr: ProductVariant[] = Array.isArray((p as any).variants)
                        ? ((p as any).variants as any[]).map(v => ({
                            id: v.id,
                            color: v.color ?? '',
                            size: v.size ?? '',
                            quantity: toNum(v.quantity ?? v.qty ?? v.stock),
                            price: toNum(v.price ?? 0),
                            sku: v.sku ?? v.code ?? '',
                        }))
                        : [];

                    // 1) số biến thể: nhận cả number lẫn array
                    const variantCount =
                        variantsArr.length ||
                        toNum((p as any).variantsCount ?? (p as any).variantCount ?? (p as any).variants ?? 0);

                    // 2) tổng tồn kho: nếu có mảng biến thể thì cộng, nếu không lấy field tổng
                    const stockQty = Array.isArray(p.variants)
                        ? p.variants.reduce((s, v) => s + toNum(v.quantity ?? v.qty ?? v.stock), 0)
                        : toNum(p.totalQuantity ?? p.quantity ?? p.stockQty);

                    // 3) SKU: ưu tiên product-level; nếu không có thì lấy ở biến thể đầu
                    const sku =
                        p.sku ?? p.code ??
                        (Array.isArray(p.variants) && p.variants[0]?.sku ? p.variants[0].sku : '');


                    // 4) Loại: name nếu có, không thì hiển thị #ID cho đỡ trống
                    const type =
                        p.categoryName ?? p.category?.name ?? (p.CategoryId != null ? `#${p.CategoryId}` : '');
                    const rawId = (p as any).id ?? (p as any).Id ?? (p as any).productId;
                    const id = Number.isFinite(Number(rawId)) ? Number(rawId) : undefined;
                    return {
                        id,
                        name: (p as any).name ?? (p as any).productName ?? '',
                        image: (p as any).thumbnail ?? (p as any).imageUrl ?? '',
                        thumbnail: (p as any).thumbnail ?? (p as any).imageUrl ?? '',
                        type,
                        sku,
                        price: toNum((p as any).price ?? 0),
                        variants: variantsArr,          // ✅ mảng
                        variantCount,                   // ✅ số lượng (cho UI)
                        stockQty,
                        inStock: Boolean((p as any).status ?? stockQty > 0),
                        description: (p as any).description ?? '',
                        createdAt: (p as any).createdAt ?? (p as any).CreatedAt ?? '',
                        categoryId: (p as any).categoryId ?? (p as any).CategoryId,
                        categoryName: (p as any).categoryName ?? (p as any).category?.name,
                    } as Product;
                });

                // total: tuỳ BE (đừng nhân totalPages * size nếu BE có totalItems)
                const total =
                    (res as any).totalItems ??
                    (res as any).totalElements ??
                    (res as any).total ??
                    ((res as any).totalPages ?? 0) * size;

                return { items, total, page, size };
            })
        );
    }

    uploadImages(productId: number, files: File[]) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        return this.http
            .post<ProductImageBE[]>(`${this.base}/uploads/${productId}`, fd)
            .pipe(
                map(arr =>
                    (arr ?? []).map(i => ({
                        id: (i.id ?? i.imageId)!,
                        url: (i.imageUrl ?? i.url)!,
                        publicId: i.publicId ?? ''
                    }))
                )
            );
    }
// --- gắn list ảnh vào product (nếu BE tách 2 bước)
    attachImages(productId: number, images: ProductImage[]) {
        return this.http.post<void>(this.ATTACH_URL(productId), images);
    }

    setThumbnailFromImage(productId: number, imageId: number) {
        return this.http.put(
            `${this.base}/${productId}/thumbnail/from-image/${imageId}`,
            {}
        );
    }
    deleteImage(productId: number, imageId: number) {
        return this.http.delete(`${this.base}/${productId}/images/${imageId}`);
    }

    get(id: number): Observable<Product> {
        return this.http.get<any>(`${this.base}/${id}`).pipe(
            map(p => this.mapRawProduct(p))
        );
    }


    create(dto: ProductCreateDTO): Observable<Product> {
        return this.http.post<any>(this.base, dto).pipe(
            map(p => this.mapRawProduct(p))
        );
    }

    update(id: number, dto: ProductUpdateDTO): Observable<Product> {
        return this.http.put<any>(`${this.base}/${id}`, dto).pipe(
            map(p => this.mapRawProduct(p))
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    bulkDelete(ids: number[]) {
        return this.http.post<{deletedIds:number[]}>(
            `${this.base}/bulk-delete`,
            { ids } // hoặc ids nếu BE nhận mảng
        ).pipe(map(() => void 0));
    }

    setStock(id: number, inStock: boolean): Observable<Product> {
        // nếu BE có endpoint riêng, giữ như sau; nếu không, dùng update(...)
        return this.http.patch<any>(`${this.base}/${id}/stock`, { inStock }).pipe(
            map(p => this.mapRawProduct(p))
        );
    }

    }

