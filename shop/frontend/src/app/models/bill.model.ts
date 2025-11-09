export interface BillDetailRequest {
    variantId: number;
    quantity: number;
}

export interface BillCreateRequest {
    FullName: string;
    Phone: string;
    Email: string;
    ShippingAddress: string;
    details: { variantId: number; quantity: number; }[];
    PaymentMethod: string;
}

export interface BillResponse {
    BillId: number;
    UserId: number;
    FullName: string;
    Phone: string;
    ShippingAddress: string;
    status: string;
    Total: number;
    PaymentMethod: string;
}
