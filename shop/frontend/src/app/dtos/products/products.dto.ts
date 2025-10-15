import {Product} from "../../models/products.model";

export type CreateProductDTO = Omit<Product, 'id'|'createdAt'|'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;

// Kiểu “raw value” lấy từ Reactive Form
export type ProductFormValue = {
    sku: string | null;
    name: string | null;
    price: number | null;
    oldPrice: number | null;
    categoryId: number | null;
    inStock: boolean | null;
    stockQty: number | null;
    thumbnailUrl: string | null;
    tags: string | null;         // nhập 1 chuỗi, sẽ tách thành mảng
    description: string | null;
};
export function toCreateProductDTO(raw: ProductFormValue): CreateProductDTO {
    return {
        sku:          raw.sku ?? '',
        name:         raw.name ?? '',
        price:        raw.price ?? 0,
        oldPrice:     raw.oldPrice ?? undefined,
        categoryId:   raw.categoryId ?? 0,
        inStock:      raw.inStock ?? true,
        stockQty:     raw.stockQty ?? 0,
        thumbnailUrl: raw.thumbnailUrl || undefined,
        description:  raw.description ?? undefined,
        tags: (raw.tags ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
    };
}

export function toUpdateProductDTO(raw: ProductFormValue): UpdateProductDTO {
    return {
        sku:          raw.sku ?? undefined,
        name:         raw.name ?? undefined,
        price:        raw.price ?? undefined,
        oldPrice:     raw.oldPrice ?? undefined,
        categoryId:   raw.categoryId ?? undefined,
        inStock:      raw.inStock ?? undefined,
        stockQty:     raw.stockQty ?? undefined,
        thumbnailUrl: raw.thumbnailUrl || undefined,
        description:  raw.description ?? undefined,
        tags: (raw.tags ?? '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
    };
}
