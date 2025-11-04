import { StaffInfo } from './staff-info.model';

export interface BillAdminResponse {
    billId: number;
    orderDate: string;
    status: string;
    total: number;
    paymentMethod: string;
    customerFullName: string;
    customerPhone: string;
    shippingAddress: string;
    paymentStatus: string;
    staff: StaffInfo | null;
}