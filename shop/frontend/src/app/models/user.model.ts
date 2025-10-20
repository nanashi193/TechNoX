export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    ordersCount: number;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
}
export interface Address {
    line1?: string; line2?: string; city?: string;
    postalCode?: string; country?: string;
}

export interface UserDetail extends User {
    shippingAddress?: Address;
    billingAddress?: Address;
    maskedCard?: string;
}
