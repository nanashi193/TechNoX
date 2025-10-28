export interface Product {
    id: number;
    name: string;
    type: string;     // Electronics | Shoes | ...
    sku: string;
    price: number;
    variants: number;
    inStock: boolean;
    stockQty?: number;
    image: string;
    createdAt?: string;
    updatedAt?: string;
    description: string;
}

export interface Page<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
}
