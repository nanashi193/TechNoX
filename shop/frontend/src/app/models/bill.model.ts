export interface BillDetailRequest {
    variantId: number;
    quantity: number;
}

export interface BillCreateRequest {
    FullName: string;
    Email?: string;
    Phone: string;
    ShippingAddress: string;
    paymentMethod: string;
    details: BillDetailRequest[];
}

export interface Bill {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    total: number;
    paymentMethod: string;
    orderDate: string;
    shippingAddress: string;
    phone: string;
    status: string;
    details: any[];
}