// shop/frontend/src/app/models/payment.model.ts
// Các model dùng chung cho flow thanh toán (FE)

export interface CartItem {
    id: string;
    name: string;
    price: number; // VND, số nguyên
    qty: number;   // số lượng, số nguyên
}

export interface User {
    id: string;
    fullName: string;
    email?: string;
}

export interface Customer {
    cccd?: string;
    address?: string;
}

/** Item gửi sang PayOS */
export interface PayOSItem {
    name: string;
    quantity: number; // số nguyên
    price: number;    // VND, số nguyên
}

/** Payload tạo link PayOS (gửi từ FE lên backend) */
export interface CreatePayOSLinkPayload {
    /** PayOS yêu cầu orderCode là số nguyên dương & duy nhất cho mỗi giao dịch */
    orderCode: number;

    /** Tổng tiền VND, số nguyên (nên Math.round trước khi gửi) */
    amount: number;

    description: string;
    returnUrl: string;
    cancelUrl: string;

    items: PayOSItem[];

    buyer?: {
        name?: string;
        address?: string;
        email?: string;
    };
}

/** Response backend trả về cho FE khi tạo link */
export interface CreatePayOSLinkResponse {
    /** URL trang thanh toán PayOS để FE redirect */
    checkoutUrl: string;

    /** Backend có thể trả kèm orderCode để FE đồng bộ; để optional cho linh hoạt */
    orderCode?: number;
}
