export interface Product {
    id: number;
    sku: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    categoryId: number;
    categoryName?: string;
    inStock: boolean;
    stockQty: number;
    thumbnailUrl?: string | null;
    tags?: string[];
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Page<T> {
    items: T[];
    totalItems: number;
    page: number;   // 0-based
    size: number;
}
