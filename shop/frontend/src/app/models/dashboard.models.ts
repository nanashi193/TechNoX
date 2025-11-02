
export interface Kpi {
    revenueToday: number;
    ordersToday: number;
    newCustomersToday: number;
}

export interface OrderStat {
    label: string;
    value: number;
}

export interface TopProduct {
    image: string;
    name: string;
    changePct: number;
    price: number;
    sold: number;
    sales: number;
}

export interface NewProduct {
    image: string;
    name: string;
    date: string;   // có thể đổi sang Date nếu backend trả dạng ISO
}
export type Bucket = 'day'|'month';

export interface RevenueQuery {
    from: string;
    to: string;
    bucket?: Bucket;
}

export interface RevenuePoint {
    date: string;         // ISO yyyy-MM-dd
    revenue: number;
    orders: number;
}

export interface RevenueSeries {
    bucket: Bucket;
    currency: 'VND'|'USD';
    points: RevenuePoint[];
    totals: { revenue: number; orders: number; aov: number };
}
