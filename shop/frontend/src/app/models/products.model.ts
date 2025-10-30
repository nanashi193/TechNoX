
export interface ProductVariant {
    id?: number;           // chỉ có khi EDIT
    color: string;
    size: string;
    quantity: number;
    price: number;
    sku: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;

    // BE/FE chung
    description?: string;
    thumbnail?: string;     // ảnh chính BE dùng
    status?: boolean;       // trạng thái hiển thị
    categoryId?: number | null;    // để pre-select trong Edit
    categoryName?: string | null;  // để hiển thị


    // Các field FE đang dùng thêm
    sku?: string;           // nếu SKU ở product-level
    inStock?: boolean;
    stockQty?: number;
    image?: string;         // FE preview, map -> thumbnail khi gửi
    images?: string[];

    variants?: ProductVariant[]; // ⟵ mảng biến thể, KHÔNG phải number
    variantCount?: number;       // (tuỳ chọn) nếu bạn cần đếm cho list

    createdAt?: string;
    updatedAt?: string;

    [k: string]: any;
}

export interface Page<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
}