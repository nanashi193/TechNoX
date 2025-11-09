export interface CustomerVariant {
    variantId: number;
    sku: string;
    color?: string; // Đặt là optional nếu không phải lúc nào cũng có
    size?: string;  // Đặt là optional nếu không phải lúc nào cũng có
    price?: number; // Giá riêng của variant (nếu có)
    quantity: number; // Số lượng tồn kho của variant
}

// Interface cho sản phẩm (khớp với CustomerProductDTO)
export interface CustomerProduct {
    id: number;
    name: string;
    price: number;       // Giá gốc / giá hiển thị chính
    image: string;       // URL ảnh chính
    imageUrls: string[];
    description: string;
    categoryName: string;
    inStock: boolean;    // Còn hàng hay không (tổng thể)
    variants: CustomerVariant[]; // Danh sách biến thể
}

export interface PageInfo { // Tạo interface cho object 'page'
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

export interface CustomerProductPage {
    content: CustomerProduct[];
    page: PageInfo;
}