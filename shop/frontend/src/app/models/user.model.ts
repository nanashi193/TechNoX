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
