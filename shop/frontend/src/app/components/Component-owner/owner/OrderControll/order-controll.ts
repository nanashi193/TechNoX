import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type OrderStatus = 'processing' | 'paid' | 'completed';
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
    status: OrderStatus;
    orderType: OrderType;
    createdAt: string;
    assignedStaffId?: string;   // có = đã phân công (khóa không cho đổi)
    _expanded?: boolean;        // UI only
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

    orders = signal<Order[]>([]);
    staff  = signal<Staff[]>([]);
    statusFilter = signal<'all' | OrderStatus>('all');
    search = signal<string>('');
    autoPurgeCount = signal(0);

    readonly statusMeta: Record<OrderStatus, { label: string; color: 'processing'|'paid'|'delivered' }> = {
        processing: { label: 'Đang xử lí',    color: 'processing' },
        paid:       { label: 'Đã thanh toán', color: 'paid' },
        completed:  { label: 'Đã hoàn thành', color: 'delivered' },
    };
    meta(o: Order) { return this.statusMeta[o.status]; }

    private matchSearch = (o: Order, q: string) =>
        !q || [o.customerName, o.phone, o.id, o.address, o.orderType]
            .some(v => (v ?? '').toString().toLowerCase().includes(q));

    // ====== Phân nhóm hiển thị ======
    activeOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isActive = o.status === 'processing' || o.status === 'paid';
            const pass = (sf === 'all' && isActive) || (sf === o.status);
            return isActive && pass && this.matchSearch(o, q);
        });
    });

    completedOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isDone = o.status === 'completed';
            const pass = (sf === 'all' && isDone) || (sf === 'completed');
            return isDone && pass && this.matchSearch(o, q);
        });
    });

    // ====== Lifecycle ======
    ngOnInit(): void {
        this.seedIfNeeded();
        this.loadFromStorage();
        this.backfillStaffForCompletedSamples(); // tự điền staff cho đơn completed thiếu assignedStaffId (chỉ để test/compat)
        this.cleanupExpiredOrders(true);         // auto dọn đơn processing > 24h
    }

    // ====== LocalStorage ======
    private seedIfNeeded(): void {
        if (!localStorage.getItem(LS_STAFF) || !localStorage.getItem(LS_ORDERS)) {
            const { staff, orders } = this.mockData();
            localStorage.setItem(LS_STAFF, JSON.stringify(staff));
            localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
        }
    }

    private loadFromStorage(): void {
        this.loading = true;
        try {
            const staff = JSON.parse(localStorage.getItem(LS_STAFF)  || '[]') as Staff[];
            const ordersRaw = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]') as any[];
            const { orders, changed } = this.migrateOrders(ordersRaw);
            this.staff.set(staff);
            this.orders.set(orders);
            if (changed) {
                this.persistOrders();
                this.successMsg = 'Dữ liệu đơn đã được nâng cấp (bổ sung loại đơn).';
            }
        } catch {
            this.errorMsg = 'Dữ liệu local lỗi, đã reset.';
            localStorage.removeItem(LS_STAFF);
            localStorage.removeItem(LS_ORDERS);
            this.seedIfNeeded();
            const staff = JSON.parse(localStorage.getItem(LS_STAFF)  || '[]') as Staff[];
            const { orders } = this.migrateOrders(JSON.parse(localStorage.getItem(LS_ORDERS) || '[]') as any[]);
            this.staff.set(staff);
            this.orders.set(orders);
        } finally {
            this.loading = false;
        }
    }

    /** migrate: đảm bảo có orderType/createdAt; thêm _expanded */
    private migrateOrders(ordersRaw: any[]): { orders: Order[]; changed: boolean } {
        let changed = false;
        const normalized = (ordersRaw || []).map((o: any) => {
            const hasValidType = o?.orderType === 'COD' || o?.orderType === 'POS';
            const orderType: OrderType = hasValidType ? o.orderType : 'COD';
            if (!hasValidType) changed = true;

            const createdAt = o?.createdAt ?? new Date().toISOString();
            if (!o?.createdAt) changed = true;

            const out: Order = {
                ...o,
                orderType,
                createdAt,
                _expanded: false
            };
            return out;
        });
        return { orders: normalized, changed };
    }

    private persistOrders(): void {
        const clean = this.orders().map(({ _expanded, ...o }) => o);
        localStorage.setItem(LS_ORDERS, JSON.stringify(clean));
    }

    // ====== Helpers / Actions ======
    setFilter(v: 'all' | OrderStatus): void { this.statusFilter.set(v); }
    toggleExpand(order: Order): void { order._expanded = !order._expanded; this.orders.set([...this.orders()]); }
    trackOrder = (_: number, o: Order) => o.id;
    trackStaff = (_: number, s: Staff) => s.id;

    getStaffLabel(id?: string): string {
        if (!id) return '';
        const s = this.staff().find(x => x.id === id);
        return s ? `${s.name}${s.phone ? ' (' + s.phone + ')' : ''}` : id;
    }

    /** KHÓA: nếu đã có assignedStaffId thì không cho đổi nữa */
    assignStaff(order: Order, staffId: string | null): void {
        if (order.status === 'completed') return;  // done -> không đổi
        if (order.assignedStaffId) {               // đã phân công rồi -> chặn
            this.errorMsg = 'Đơn đã phân công, không thể thay đổi.';
            return;
        }
        if (!staffId) return;                      // không chọn ai -> bỏ
        const idx = this.orders().findIndex(o => o.id === order.id);
        if (idx !== -1) {
            const next = [...this.orders()];
            next[idx] = { ...next[idx], assignedStaffId: staffId };
            this.orders.set(next);
            this.persistOrders();
            this.successMsg = 'Đã phân công nhân viên.';
        }
    }

    /** Xoá các đơn ở trạng thái processing quá 24h */
    cleanupExpiredOrders(silent = false): void {
        const HOURS = 24;
        const cutoff = Date.now() - HOURS * 3600_000;

        const kept: Order[] = [];
        let removed = 0;

        for (const o of this.orders()) {
            const created = new Date(o.createdAt).getTime();
            const expiredProcessing = o.status === 'processing' && created < cutoff;
            if (expiredProcessing) { removed++; continue; }
            kept.push(o);
        }

        if (removed > 0) {
            this.orders.set(kept);
            this.persistOrders();
            this.autoPurgeCount.set(removed);
            if (!silent) this.successMsg = `Đã xoá ${removed} đơn quá ${HOURS}h chưa xử lí.`;
        } else {
            if (!silent) this.successMsg = 'Không có đơn quá hạn.';
        }
    }

    /** Backfill chỉ để test/compat: nếu completed mà thiếu assignedStaffId thì gán NV đầu tiên */
    private backfillStaffForCompletedSamples(): void {
        const list = this.orders();
        if (!list.length) return;
        let changed = false;
        const fallbackStaffId = this.staff()[0]?.id || 's1';

        for (const o of list) {
            if (o.status === 'completed' && !o.assignedStaffId) {
                o.assignedStaffId = fallbackStaffId;
                changed = true;
            }
        }
        if (changed) {
            this.orders.set([...list]);
            this.persistOrders();
        }
    }

    // ====== Mock seed ======
    private mockData() {
        const staff: Staff[] = [
            { id: 's1', name: 'Nguyễn An',  phone: '0901 234 567', region: 'Q1' },
            { id: 's2', name: 'Trần Bình',  phone: '0902 345 678', region: 'Q3' },
            { id: 's3', name: 'Lê Chi',     phone: '0903 456 789', region: 'Thủ Đức' },
        ];

        const orders: Order[] = [
            // quá hạn >24h để thấy auto-purge
            {
                id: 'DH-0999',
                customerName: 'Mẫu quá hạn',
                phone: '0900 000 000',
                address: 'Demo',
                items: [ { sku: 'DEMO-1', name: 'Sản phẩm demo', qty: 1, price: 100_000 } ],
                total: 100_000,
                status: 'processing',
                orderType: 'COD',
                createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
            },
            // processing — đã phân công sẵn (UI sẽ hiển thị tên NV, không cho đổi)
            {
                id: 'DH-1001',
                customerName: 'Phạm Minh',
                phone: '0987 111 222',
                address: '12 Trần Hưng Đạo, Q1',
                items: [
                    { sku: 'A-01', name: 'Áo thun', qty: 2, price: 120_000 },
                    { sku: 'B-99', name: 'Balo',    qty: 1, price: 450_000 },
                ],
                total: 690_000,
                status: 'processing',
                orderType: 'COD',
                createdAt: new Date().toISOString(),
                assignedStaffId: 's2'
            },
            // processing — chưa phân công
            {
                id: 'DH-1001-P',
                customerName: 'Lâm Tứ',
                phone: '0909 888 777',
                address: '19 Nguyễn Du, Q1',
                items: [ { sku: 'D-12', name: 'Đồng hồ', qty: 1, price: 850_000 } ],
                total: 850_000,
                status: 'processing',
                orderType: 'POS',
                createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
            },
            // paid — POS
            {
                id: 'DH-1002',
                customerName: 'Võ Khoa',
                phone: '0987 333 444',
                address: '88 Võ Văn Kiệt, Q5',
                items: [ { sku: 'C-10', name: 'Mũ lưỡi trai', qty: 1, price: 150_000 } ],
                total: 150_000,
                status: 'paid',
                orderType: 'POS',
                createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
            },
            // paid — COD
            {
                id: 'DH-1010',
                customerName: 'Trịnh Hà',
                phone: '0912 456 123',
                address: '21 Nguyễn Văn Cừ, Q5',
                items: [
                    { sku: 'PB-01', name: 'Pin dự phòng', qty: 1, price: 350_000 },
                    { sku: 'CB-02', name: 'Cáp sạc',      qty: 2, price: 99_000 },
                ],
                total: 548_000,
                status: 'paid',
                orderType: 'COD',
                createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
            },
            // completed — có assignedStaffId để hiển thị tên NV
            {
                id: 'DH-1003',
                customerName: 'Đặng Ly',
                phone: '0912 888 999',
                address: 'KĐT Vạn Phúc, Thủ Đức',
                items: [ { sku: 'Z-7', name: 'Giày thể thao', qty: 1, price: 1_200_000 } ],
                total: 1_200_000,
                status: 'completed',
                orderType: 'COD',
                createdAt: new Date(Date.now() - 36 * 3600_000).toISOString(),
                assignedStaffId: 's3'
            },
            // completed — sample 1
            {
                id: 'DH-1105',
                customerName: 'Nguyễn Tiến',
                phone: '0905 222 333',
                address: '25 Lê Lợi, Q1',
                items: [
                    { sku: 'TA-01', name: 'Tai nghe',        qty: 1, price: 390_000 },
                    { sku: 'OC-02', name: 'Ốp lưng iPhone',  qty: 2, price: 99_000  },
                ],
                total: 390_000 + 2 * 99_000, // 588_000
                status: 'completed',
                orderType: 'COD',
                createdAt: new Date(Date.now() - 30 * 3600_000).toISOString(),
                assignedStaffId: 's1' // Nguyễn An
            },
            // completed — sample 2
            {
                id: 'DH-1106',
                customerName: 'Trần Hà',
                phone: '0933 777 888',
                address: '48 Nguyễn Thị Minh Khai, Q3',
                items: [
                    { sku: 'KB-10', name: 'Bàn phím cơ', qty: 1, price: 1_250_000 },
                ],
                total: 1_250_000,
                status: 'completed',
                orderType: 'POS',
                createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
                assignedStaffId: 's2' // Trần Bình
            }
        ];

        return { staff, orders };
    }
}
