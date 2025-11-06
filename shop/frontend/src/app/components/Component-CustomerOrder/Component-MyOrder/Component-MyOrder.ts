import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type OrderStatus =
    | 'PENDING' | 'CONFIRMED' | 'PACKED'
    | 'SHIPPING' | 'DELIVERED'
    | 'COMPLETED' | 'CANCELLED';

type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDING' | 'REFUNDED';

interface OrderItem {
    name: string;
    price: number;
    qty: number;
    color?: string;
    variant?: string;
    image?: string;
}

interface Order {
    id: number | string;
    code?: string;
    createdAt: string;      // ISO datetime
    total: number;          // Tổng thanh toán
    status: OrderStatus;
    paymentMethod?: 'COD' | 'PAYOS' | 'VNPAY' | 'MOMO' | 'BANK' | string;
    paymentStatus?: PaymentStatus;

    courierName?: string;
    courierPhone?: string;

    items?: OrderItem[];
}

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './Component-MyOrder.html',
    styleUrls: ['./Component-MyOrder.css']
})
export class ComponentMyOrderComponent implements OnInit {
    loading = true;
    orders: Order[] = [];
    busy: Record<string | number, boolean> = {};
    expanded: Record<string | number, boolean> = {};

    ngOnInit(): void {
        // Mock FE
        this.orders = [
            {
                id: 101,
                code: 'DH101',
                createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h trước
                total: 12_530_000,
                status: 'CONFIRMED',
                paymentMethod: 'COD',
                paymentStatus: 'UNPAID',
                courierName: 'Nguyễn Văn Ship',
                courierPhone: '0987 123 456',
                items: [
                    { name: 'iPhone 15 Pro 128GB', price: 25_990_000, qty: 1, color: 'Titan', image: 'assets/Phone/IPhone.jpg' },
                    { name: 'Ốp lưng MagSafe', price: 790_000, qty: 1, color: 'Đen' }
                ]
            },
            {
                id: 102,
                code: 'DH102',
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h trước
                total: 3_310_000,
                status: 'SHIPPING', // đang giao -> disable Hủy
                paymentMethod: 'PAYOS',
                paymentStatus: 'UNPAID',
                courierName: 'Trần Thị Nhanh',
                courierPhone: '0909 456 789',
                items: [
                    { name: 'Tai nghe Bluetooth ANC', price: 1_990_000, qty: 1, color: 'Trắng', image: 'assets/accessories/headphone.jpg' },
                    { name: 'Sạc nhanh 65W', price: 690_000, qty: 1 },
                    { name: 'Cáp USB-C 2m', price: 290_000, qty: 2 }
                ]
            },
            {
                id: 103,
                code: 'DH103',
                createdAt: '2025-11-03T13:30:00Z',
                total: 7_990_000,
                status: 'COMPLETED', // hoàn tất -> disable Hủy
                paymentMethod: 'VNPAY',
                paymentStatus: 'PAID',
                courierName: '—',
                items: [
                    { name: 'iPad 10.9 Wi-Fi 64GB', price: 7_990_000, qty: 1, color: 'Bạc', image: 'assets/Phone/Iphone1.jpg' }
                ]
            }
        ];
        this.loading = false;
    }

    // ===== helpers =====
    trackById = (_: number, o: Order) => o.id;
    formatMoney(n: number) { return (n ?? 0).toLocaleString('vi-VN') + 'đ'; }

    displayPhone(p?: string): string { return (p ?? '').trim(); }
    safeTelHref(p?: string): string | null {
        const digits = (p ?? '').toString().replace(/\D+/g, '');
        return digits ? `tel:${digits}` : null;
    }

    isExpanded(o: Order): boolean { return !!this.expanded[o.id]; }
    toggleExpand(o: Order): void { this.expanded[o.id] = !this.expanded[o.id]; }

    /** Item đầu tiên để tóm gọn */
    firstItem(o: Order) {
        const arr = o.items;
        return arr && arr.length ? arr[0] : null;
    }

    /** Khóa hủy: đang giao hoặc đã hoàn tất -> không thể hủy */
    isCancelLocked(o: Order): boolean {
        const s = (o.status || '').toUpperCase();
        return ['SHIPPING','DELIVERED','COMPLETED'].includes(s);
    }

    showConfirm(o: Order): boolean {
        const s = (o.status || '').toUpperCase();
        const p = (o.paymentStatus || 'UNPAID').toUpperCase();
        return (s === 'DELIVERED' || s === 'SHIPPING') && p !== 'PAID';
    }

    confirmReceived(o: Order) {
        if (this.busy[o.id]) return;
        this.busy[o.id] = true;
        setTimeout(() => {
            const i = this.orders.findIndex(x => x.id === o.id);
            if (i >= 0) this.orders[i] = { ...this.orders[i], status: 'COMPLETED', paymentStatus: 'PAID' };
            this.busy[o.id] = false;
        }, 400);
    }

    cancelOrder(o: Order) {
        // Phòng thủ: nếu bị khóa thì không hủy (UI cũng đã disabled)
        if (this.isCancelLocked(o) || this.busy[o.id]) return;

        const ok = window.confirm(`Hủy đơn #${o.code || o.id}?`);
        if (!ok) return;

        this.busy[o.id] = true;
        setTimeout(() => {
            const i = this.orders.findIndex(x => x.id === o.id);
            if (i >= 0) this.orders[i] = { ...this.orders[i], status: 'CANCELLED' };
            this.busy[o.id] = false;
        }, 350);
    }
}
