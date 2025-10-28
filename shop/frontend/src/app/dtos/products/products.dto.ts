import { Product } from '../../models/products.model';

export type CreateProductDTO = Omit<Product, 'id'|'createdAt'|'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;

export type ProductFormValue = {
    sku: string | null;
    name: string | null;
    price: number | null;
    inStock: boolean | null;

    // các field có trong Product
    type: string | null;
    variants: number | null;
    image: string | null;         // nếu form đang dùng thumbnailUrl, vẫn giữ thêm ở dưới
    thumbnailUrl?: string | null; // hỗ trợ alias -> map sang image

    // UI-only
    oldPrice?: number | null;
    categoryId?: number | null;
    stockQty?: number | null;
    tags?: string | null;
    description?: string | null;
};

export function toCreateProductDTO(raw: ProductFormValue): CreateProductDTO {
    return {
        sku:      raw.sku ?? '',
        name:     raw.name ?? '',
        price:    raw.price ?? 0,
        inStock:  raw.inStock ?? true,
        type:     raw.type ?? '',
        variants: raw.variants ?? 0,
        image:    (raw.image ?? raw.thumbnailUrl ?? ''), // alias thumbnailUrl -> image
        description: raw.description ?? '',
    };
}


export function toUpdateProductDTO(raw: ProductFormValue): UpdateProductDTO {
    const dto: UpdateProductDTO = {};
    if (raw.sku != null)      dto.sku = raw.sku;
    if (raw.name != null)     dto.name = raw.name;
    if (raw.price != null)    dto.price = raw.price;
    if (raw.inStock != null)  dto.inStock = raw.inStock;
    if (raw.type != null)     dto.type = raw.type;
    if (raw.variants != null) dto.variants = raw.variants;
    if (raw.description != null) dto.description = raw.description;
    // map alias image/thumbnailUrl
    if (raw.image != null || raw.thumbnailUrl != null) {
        dto.image = raw.image ?? raw.thumbnailUrl ?? '';
    }
    return dto;
}
