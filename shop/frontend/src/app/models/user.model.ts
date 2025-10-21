export interface Address {
    addressId: number;
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    province: string;
    zipCode?: string;
}
export interface User {
    id: number;
    FullName: string;
    email: string;
    PhoneNumber?: string;
    avatarUrl?: string;
    roleName: string;
    IsActive: boolean;
    address?: Address;
    CreateAt: string;
    stats?: { orders: number; totalSpent: number };
}
export interface UserStats {
    orders: number;
    totalSpent: number;
}
export interface UserDetail {
    id: number;
    FullName: string;
    email: string;
    PhoneNumber: string;
    IsActive: boolean;
    roleName: string;
    CreateAt: string;
    stats: UserStats;
    shippingAddress: Address;
}
