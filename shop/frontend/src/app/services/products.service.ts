import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {Page, Product, ProductImageItem, ProductVariant} from '../models/products.model';
import {map} from 'rxjs/operators';
import {ProductCreateDTO, ProductUpdateDTO, ProductVariantDTO} from "../dtos/products/products.dto";
import {ProductImage, ProductImageBE} from "../models/product-image.model";

export interface ProductListResponse {
    products: Product[];
    totalPages: number; // từ BE
    totalElements?: number;
    total?: number;
    totalItems?: number;
}


@Injectable({providedIn: 'root'})
export class ProductService {
    private http = inject(HttpClient);
    private base = `${environment.apiBaseUrl}/products`;
    private readonly UPLOAD_URL = `${this.base}/images/upload`;     // ⬅️ chỉnh cho khớp BE
    private readonly ATTACH_URL = (id: number) => `${this.base}/${id}/images`;
    private useMock = !!(environment as any).useMock; // true => dùng mock
    private toNum = (v: any) => (v == null ? 0 : Number(v));

    private pickSku(raw: any, variantsArr: ProductVariant[]): string {
        const s = (raw?.sku ?? raw?.code ?? '').toString().trim();
        if (s) return s;
        const v = variantsArr.find(x => (x.sku ?? '').toString().trim());
        return (v?.sku ?? '').toString().trim();
    }

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
            : toNum(p?.totalQuantity ?? p?.quantity ?? p?.stockQty ?? 0);

        const imageItems: ProductImageItem[] = Array.isArray(p?.imageItems)
            ? p.imageItems.map((it: any) => ({
                id: Number(it.id),
                url: String(it.url),
            }))
            : [];

        const thumbnail = p?.thumbnail ?? p?.imageUrl ?? imageItems[0]?.url ?? '';

        return {
            id: Number(p?.id ?? p?.Id ?? p?.productId ?? 0),
            name: p?.name ?? p?.productName ?? '',
            image: thumbnail,                // back-compat nếu UI cũ dùng 'image'
            thumbnail,                       // ảnh đại diện
            imageItems,
            type: p?.categoryName ?? p?.category?.name ?? (p?.CategoryId != null ? `#${p?.CategoryId}` : ''),
            sku: this.pickSku(p, variantsArr),
            price: toNum(p?.price ?? 0),
            variants: variantsArr,
            variantCount: variantsArr.length,
            stockQty,
            inStock: (p?.status ?? null) != null ? Boolean(p.status) : stockQty > 0,
            description: p?.description ?? '',
            createdAt: p?.createdAt ?? p?.createAt ?? p?.CreatedAt ?? '',
            categoryId: p?.categoryId ?? p?.CategoryId ?? p?.category?.id ?? null,
            categoryName: p?.categoryName ?? p?.category?.name ?? null,
        } as Product;
    }

    search({
               page = 1,
               size = 8,
               keyword,
               sku,
               category_id,
               min_price,
               max_price,
               sort,
           }: {
        page?: number;
        size?: number;
        keyword?: string;
        sku?: string;
        category_id?: number;
        min_price?: number;
        max_price?: number;
        sort?: string;
    } = {}) {
        const page0 = Math.max(0, page - 1);

        let params = new HttpParams()
            .set('page', String(page0))
            .set('limit', String(size));

        if (keyword)             params = params.set('keyword', keyword);
        if (sku)                 params = params.set('sku', sku);
        if (category_id != null && category_id > 0)
            params = params.set('category_id', String(category_id));
        if (min_price != null)   params = params.set('min_price', String(min_price));
        if (max_price != null)   params = params.set('max_price', String(max_price));
        if (sort)                params = params.set('sort', sort); // 👈 field_dir


        return this.http.get<ProductListResponse>(this.base, {params}).pipe(
            map(res => {
                const raw = (res.products ?? []) as any[];
                const items: Product[] = raw.map(p => this.mapRawProduct(p)); // 👈 dùng lại mapper đã đúng kiểu

                const total =
                    (res as any).totalItems ??
                    (res as any).totalElements ??
                    (res as any).total ??
                    ((res as any).totalPages ?? 0) * size;

                return {items, total, page, size};
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
        return this.http.put<{ productId: number; thumbnail: string }>(
            `${this.base}/${productId}/thumbnail/from-image/${imageId}`, {}
        );
    }

    deleteImage(productId: number, imageId: number) {
        return this.http.delete<{ message: string }>(
            `${this.base}/${productId}/images/${imageId}`
        );
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

    update(id: number, dto: ProductUpdateDTO) {
        if (id == null) throw new Error('update() called without id');
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    upsertVariant(productId: number, dto: ProductVariantDTO) {
        return this.http.post<void>(`${this.base}/${productId}/variants`, dto);
    }

    deleteVariant(productId: number, variantId: number) {
        return this.http.delete(`/api/v1/products/${productId}/variants/${variantId}`);
    }


    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    bulkDelete(ids: number[]) {
        return this.http.post<{ deletedIds: number[] }>(
            `${this.base}/bulk-delete`,
            {ids} // hoặc ids nếu BE nhận mảng
        ).pipe(map(() => void 0));
    }

    setStock(id: number, inStock: boolean): Observable<Product> {
        // nếu BE có endpoint riêng, giữ như sau; nếu không, dùng update(...)
        return this.http.patch<any>(`${this.base}/${id}/stock`, {inStock}).pipe(
            map(p => this.mapRawProduct(p))
        );
    }

}

