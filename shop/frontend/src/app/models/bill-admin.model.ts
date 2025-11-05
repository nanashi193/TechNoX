import { StaffInfo } from './staff-info.model';

export interface BillAdminResponse {
    billId: number;
    userId: number;
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

export interface BillItem {
    ProductId: number;
    ProductName: string;
    VariantId?: number;
    Color?: string;
    Size?: string;
    Quantity: number;
    Price: number;
    Thumbnail?: string;
}

export interface BillAdminDetailResponse extends BillAdminResponse {
    details?: BillItem[];
    subtotal?: number;
    shippingFee?: number;
    tax?: number;
    discount?: number;
    paidAmount?: number;

    customerEmail?: string;
    billingAddress?: string;
    code?: string;
    shippingCode?: string;
    shippingCarrier?: string;
    shippingTimeline?: Array<{ time: string; status: string; note?: string }>;
}