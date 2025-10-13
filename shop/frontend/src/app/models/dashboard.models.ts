
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
