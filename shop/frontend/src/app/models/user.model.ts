export interface Address {
    addressID: number;
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    province: string;
    zip?: string;
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