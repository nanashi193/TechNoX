import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type OrderType = 'COD' | 'POS';
type OrderStatus = 'processing' | 'paid' | 'delivered';

interface Staff {
    id: string;
    label: string; // Tên + SĐT hiển thị
}

interface Order {
    id: string;
    customerName: string;
    phone: string;
    orderType: OrderType;
    total: number;
    status: OrderStatus;
    createdAt: Date | string;
    staffId?: string; // nhân viên được giao
}

@Component({
    selector: 'app-order-shipping',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './Order-shipping.html',
    styleUrls: ['./Order-shipping.css'],
})
export class OrderShippingComponent {
    // ====== Data mẫu ======
    staffList: Staff[] = [
        { id: 's1', label: 'Trần Bình (0902 345 678)' },
        { id: 's2', label: 'Nguyễn An (0901 234 567)' },
    ];

    selectedStaffId = this.staffList[0].id;
    query = '';

    private orders: Order[] = [
        // Cần giao (đã phân công cho s1)
        {
            id: 'DH-1001',
            customerName: 'Phạm Minh',
            phone: '0987 111 222',
            orderType: 'COD',
            total: 690000,
            status: 'processing',
            createdAt: new Date('2025-11-04T00:19:00'),
            staffId: 's1',
        },
        {
            id: 'DH-8231',
            customerName: 'Sample Khoa',
            phone: '09620284943',
            orderType: 'COD',
            total: 350000,
            status: 'paid',
            createdAt: new Date('2025-11-04T11:42:00'),
            staffId: 's1',
        },
        // Cần giao (đã phân công cho s2)
        {
            id: 'DH-3663',
            customerName: 'Sample An',
            phone: '09925001142',
            orderType: 'COD',
            total: 120000,
            status: 'processing',
            createdAt: new Date('2025-11-04T11:42:00'),
            staffId: 's2',
        },
        {
            id: 'DH-5132',
            customerName: 'Sample Ngọc',
            phone: '09290872554',
            orderType: 'COD',
            total: 99000,
            status: 'processing',
            createdAt: new Date('2025-11-04T11:42:00'),
            staffId: 's2',
        },
        // ĐÃ GIAO (cho s1 – để demo bảng “Đơn đã giao”)
        {
            id: 'DH-1003',
            customerName: 'Đặng Ly',
            phone: '0912 888 999',
            orderType: 'COD',
            total: 1200000,
            status: 'delivered',
            createdAt: new Date('2025-11-02T12:19:00'),
            staffId: 's1',
        },
    ];

    // ====== Derived lists (lọc theo nhân viên + search) ======
    private matchQuery(o: Order): boolean {
        const q = this.query.trim().toLowerCase();
        if (!q) return true;
        const blob =
            `${o.id} ${o.customerName} ${o.phone} ${o.orderType}`.toLowerCase();
        return blob.includes(q);
    }

    get toDeliver(): Order[] {
        return this.orders
            .filter(
                (o) =>
                    o.staffId === this.selectedStaffId &&
                    o.status !== 'delivered' &&
                    this.matchQuery(o)
            )
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    get delivered(): Order[] {
        return this.orders
            .filter(
                (o) =>
                    o.staffId === this.selectedStaffId &&
                    o.status === 'delivered' &&
                    this.matchQuery(o)
            )
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    // ====== Actions / UI handlers ======
    onSelectStaff(ev: Event): void {
        const value = (ev.target as HTMLSelectElement).value;
        this.selectedStaffId = value;
    }

    onInputQuery(ev: Event): void {
        const value = (ev.target as HTMLInputElement).value ?? '';
        this.query = value;
    }

    markDelivered(o: Order): void {
        if (o.status !== 'delivered') o.status = 'delivered';
    }

    staffLabel(id?: string): string {
        const s = this.staffList.find((x) => x.id === id);
        return s ? s.label : '—';
    }
}
