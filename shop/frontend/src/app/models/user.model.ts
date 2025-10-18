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
    id: string;
    FullName: string;
    email: string;
    PhoneNumber?: string;
    avatarUrl?: string;
    roleName: string;
    IsActive: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    address?: Address;
    CreateAt: string;
    stats?: { orders: number; totalSpent: number };
}