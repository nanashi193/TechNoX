
export type VariantValue = {
    id?: number | null;         // có khi Edit
    color: string;
    size: string;
    quantity: number;
    price: number;
    sku: string;
};

export type ProductFormValue = {
    name: string | null;
    sku: string | null;
    description: string | null;
    price: number | null;
    status: boolean | null;
    categoryId: number | null;
    thumbnail: string | null;
    variants: VariantValue[];

    // optional
    type?: string | null;
    inStock?: boolean | null;
    stockQty?: number | null;
    image?: string | null;
};
export interface ProductVariantDTO {
    id?: number;                // chỉ gửi khi UPDATE
    color: string;
    size: string;
    quantity: number;
    price: number;
    sku: string;
}

export interface ProductCreateDTO {
    name: string;
    price: number;
    thumbnail?: string;
    description?: string;
    status: boolean;
    categoryId: number;
    variants: ProductVariantDTO[];  // mảng
}export type ProductUpdateDTO = Partial<ProductCreateDTO>;

// ----- Mappers: Form -> DTO -----
export function toCreateProductDTO(raw: ProductFormValue): ProductCreateDTO {
    const variants: ProductVariantDTO[] = (raw.variants ?? []).map(v => ({
        color: v.color,
        size: v.size,
        quantity: Number(v.quantity ?? 0),
        price: Number(v.price ?? 0),
        sku: v.sku,
    }));

    return {
        name: (raw.name ?? '').trim(),
        price: Number(raw.price ?? 0),
        thumbnail: (raw.thumbnail ?? '') || undefined,
        description: (raw.description ?? '') || undefined,
        status: Boolean(raw.status ?? true),
        categoryId: Number(raw.categoryId ?? 0),
        variants,
    };
}
export function toUpdateProductDTO(raw: Partial<ProductFormValue>): ProductUpdateDTO {
    const dto: ProductUpdateDTO = {};

    if (raw.name !== undefined)        dto.name = raw.name ?? '';
    if (raw.price !== undefined)       dto.price = Number(raw.price ?? 0);
    if (raw.thumbnail !== undefined)   dto.thumbnail = (raw.thumbnail ?? '') || undefined;
    if (raw.description !== undefined) dto.description = (raw.description ?? '') || undefined;
    if (raw.status !== undefined)      dto.status = Boolean(raw.status);
    if (raw.categoryId !== undefined && raw.categoryId !== null)
        dto.categoryId = Number(raw.categoryId);
    if (raw.variants !== undefined)    dto.variants = (raw.variants ?? []).map(v => ({
        ...(v.id != null ? { id: Number(v.id) } : {}),
        color: v.color,
        size: v.size,
        quantity: Number(v.quantity ?? 0),
        price: Number(v.price ?? 0),
        sku: v.sku,
    }));

    return dto;
}