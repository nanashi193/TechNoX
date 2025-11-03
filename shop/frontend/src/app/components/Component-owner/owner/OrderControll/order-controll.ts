import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ---- Types ----
type OrderStatus = 'processing' | 'paid' | 'completed'; // chuẩn hoá: không dùng 'delivered' trong UI
type OrderType = 'COD' | 'POS';

interface OrderItem {
    sku: string;
    name: string;
    qty: number;
    price: number;
}

interface Order {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    note?: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;       // chỉ 3 trạng thái sau chuẩn hoá
    orderType: OrderType;
    createdAt: string;
    assignedStaffId?: string;
    _expanded?: boolean;       // UI only
}

interface Staff {
    id: string;
    name: string;
    phone?: string;
    region?: string;
}

const LS_ORDERS = 'oc_orders';
const LS_STAFF  = 'oc_staff';

@Component({
    selector: 'app-order-controll',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './order-controll.html',
    styleUrls: ['./order-controll.css']
})
export class OrderControllComponent implements OnInit {
    loading = false;
    errorMsg = '';
    successMsg = '';
    assigning: Record<string, boolean> = {};

    orders = signal<Order[]>([]);
    staff = signal<Staff[]>([]);
    statusFilter = signal<'all' | OrderStatus>('all');
    search = signal<string>('');

    readonly statusMeta: Record<OrderStatus, { label: string; color: 'processing'|'paid'|'delivered' }> = {
        processing: { label: 'Đang xử lí',        color: 'processing' },
        paid:       { label: 'Đã thanh toán',     color: 'paid' },
        completed:  { label: 'Đã hoàn thành đơn', color: 'delivered' }, // tái dùng màu "delivered"
    };

    // Helper: meta theo order
    meta(o: Order) { return this.statusMeta[o.status]; }

    // ---- Lọc chung ----
    private matchSearch = (o: Order, q: string) =>
        !q || [o.customerName, o.phone, o.id, o.address, o.orderType]
            .some(v => (v ?? '').toString().toLowerCase().includes(q));

    // Bảng 1: đơn đang hoạt động (processing / paid)
    activeOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isActive = o.status === 'processing' || o.status === 'paid';
            const passFilter = (sf === 'all' && isActive) || (sf === o.status);
            return isActive && passFilter && this.matchSearch(o, q);
        });
    });

    // Bảng 2: đơn hoàn thành
    completedOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isDone = o.status === 'completed';
            const passFilter = (sf === 'all' && isDone) || (sf === 'completed');
            return isDone && passFilter && this.matchSearch(o, q);
        });
    });

    ngOnInit(): void {
        this.seedIfNeeded();
        this.loadFromStorage();
    }

    // ===== LocalStorage =====
    private seedIfNeeded(): void {
        if (!localStorage.getItem(LS_STAFF) || !localStorage.getItem(LS_ORDERS)) {
            const { staff, orders } = this.mockData();
            localStorage.setItem(LS_STAFF, JSON.stringify(staff));
            localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
        }
    }

    // Chuẩn hoá mọi status về 'completed' nếu gặp legacy 'delivered'
    private normalizeStatusRaw(status: any): OrderStatus {
        return status === 'delivered' ? 'completed' : (status as OrderStatus);
    }

    private loadFromStorage(): void {
        this.loading = true;
        try {
            const staff = JSON.parse(localStorage.getItem(LS_STAFF)  || '[]') as Staff[];
            const ordersRaw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]') as any[];
            const orders: Order[] = (ordersRaw || []).map(o => ({
                ...o,
                status: this.normalizeStatusRaw(o.status),
                _expanded: false
            }));
            this.staff.set(staff);
            this.orders.set(orders);
        } catch {
            this.errorMsg = 'Dữ liệu local lỗi, đã reset.';
            localStorage.removeItem(LS_STAFF);
            localStorage.removeItem(LS_ORDERS);
            this.seedIfNeeded();
            const staff = JSON.parse(localStorage.getItem(LS_STAFF)  || '[]') as Staff[];
            const ordersRaw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]') as any[];
            const orders: Order[] = (ordersRaw || []).map(o => ({
                ...o,
                status: this.normalizeStatusRaw(o.status),
                _expanded: false
            }));
            this.staff.set(staff);
            this.orders.set(orders);
        } finally {
            this.loading = false;
        }
    }

    private persistOrders(): void {
        const clean = this.orders().map(({ _expanded, ...o }) => o);
        localStorage.setItem(LS_ORDERS, JSON.stringify(clean));
    }

    // ===== UI actions =====
    setFilter(v: 'all' | OrderStatus): void { this.statusFilter.set(v); }
    toggleExpand(order: Order): void { order._expanded = !order._expanded; this.orders.set([...this.orders()]); }
    trackOrder = (_: number, o: Order) => o.id;
    trackStaff = (_: number, s: Staff) => s.id;

    // Không cho phân công khi đã hoàn thành
    assignStaff(order: Order, staffId: string | null): void {
        if (order.status === 'completed') return;

        this.successMsg = '';
        this.errorMsg = '';
        this.assigning[order.id] = true;

        const assigned = staffId || undefined;
        const idx = this.orders().findIndex(o => o.id === order.id);
        if (idx !== -1) {
            const next = [...this.orders()];
            next[idx] = { ...next[idx], assignedStaffId: assigned };
            this.orders.set(next);
            this.persistOrders();
            this.successMsg = 'Đã cập nhật phân công (LocalStorage).';
        } else {
            this.errorMsg = 'Không tìm thấy đơn để cập nhật.';
        }

        this.assigning[order.id] = false;
    }

    // ===== Mock data =====
    private mockData() {
        const staff: Staff[] = [
            { id: 's1', name: 'Nguyễn An',  phone: '0901 234 567', region: 'Q1' },
            { id: 's2', name: 'Trần Bình',  phone: '0902 345 678', region: 'Q3' },
            { id: 's3', name: 'Lê Chi',     phone: '0903 456 789', region: 'Thủ Đức' },
        ];
        const orders: Order[] = [
            {
                id: 'DH-1001',
                customerName: 'Phạm Minh',
                phone: '0987 111 222',
                address: '12 Trần Hưng Đạo, Q1',
                items: [
                    { sku: 'A-01', name: 'Áo thun', qty: 2, price: 120000 },
                    { sku: 'B-99', name: 'Balo', qty: 1, price: 450000 },
                ],
                total: 690000,
                status: 'processing',
                orderType: 'COD',
                createdAt: new Date().toISOString(),
                assignedStaffId: 's1'
            },
            {
                id: 'DH-1002',
                customerName: 'Võ Khoa',
                phone: '0987 333 444',
                address: '88 Võ Văn Kiệt, Q5',
                items: [ { sku: 'C-10', name: 'Mũ lưỡi trai', qty: 1, price: 150000 } ],
                total: 150000,
                status: 'paid',
                orderType: 'POS',
                createdAt: new Date(Date.now() - 3600_000 * 20).toISOString(),
            },
            {
                id: 'DH-1003',
                customerName: 'Đặng Ly',
                phone: '0912 888 999',
                address: 'KĐT Vạn Phúc, Thủ Đức',
                items: [ { sku: 'Z-7', name: 'Giày thể thao', qty: 1, price: 1200000 } ],
                total: 1200000,
                status: 'completed',
                orderType: 'COD',
                createdAt: new Date(Date.now() - 3600_000 * 36).toISOString(),
                assignedStaffId: 's3'
            }
        ];
        return { staff, orders };
    }
}
