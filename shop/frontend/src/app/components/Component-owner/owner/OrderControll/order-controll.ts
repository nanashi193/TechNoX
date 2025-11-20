import {Component, OnInit, signal, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {BillAdminResponse} from '../../../../models/bill-admin.model';
import {StaffInfo} from '../../../../models/staff-info.model';
import {BillAdminService} from "../../../../services/bill-admin.service";
import {ActivatedRoute, Router} from "@angular/router";
import {combineLatest} from "rxjs";

export type OrderStatus = 'Processing' | 'Confirmed' | 'Delivering' | 'Delivered' | 'Succeed' | 'Cancelled' | 'Assigned';
export type PaymentMethod = 'COD' | 'POS';

interface BillAdminUI extends BillAdminResponse {
    _expanded?: boolean;
}

@Component({
    selector: 'app-order-controll',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './order-controll.html',
    styleUrls: ['./order-controll.css']
})

export class OrderControllComponent implements OnInit {
    private billAdminService = inject(BillAdminService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    //orders-detail
    goDetail(o: BillAdminUI) { this.router.navigate(['/owner/orders', o.billId]); }

    goDetailFromEvent(ev: MouseEvent, o: BillAdminUI) {
        // ... (code cũ giữ nguyên)
        const el = ev.target as HTMLElement;
        const tag = el.tagName;
        if (['A', 'BUTTON', 'SELECT', 'OPTION', 'INPUT', 'TEXTAREA', 'LABEL'].includes(tag)) return;
        this.goDetail(o);
    }

    loading = false;
    errorMsg = signal('');
    successMsg = signal('');

    orders = signal<BillAdminUI[]>([]);
    staff = signal<StaffInfo[]>([]);
    statusFilter = signal<'all' | OrderStatus>('all');
    search = signal<string>('');

    // ===== BẮT ĐẦU CODE MỚI: Biến quản lý Modal =====
    showAssignModal = signal(false);
    orderToAssign = signal<BillAdminUI | null>(null);
    // Lưu trữ thông tin để gọi API và reset dropdown
    staffToAssign = signal<{
        id: number;
        name: string;
        element: HTMLSelectElement; // Cần để reset nếu 'Hủy'
    } | null>(null);
    // ===== KẾT THÚC CODE MỚI =====

    readonly statusMeta: Record<OrderStatus, { label: string; color: string }> = {
        // ... (code cũ giữ nguyên)
        Processing: {label: 'Đang xử lý',     color: 'processing'},
        Confirmed:  {label: 'Đã xác nhận',   color: 'paid'},
        Assigned: {label: 'Đã bàn giao',   color: 'Delivering'},
        Delivering: {label: 'Đang vận chuyển', color: 'Delivering'},
        Delivered:  {label: 'Đã giao (Chờ KH)', color: 'processing'},
        Succeed:    {label: 'Hoàn tất',      color: 'delivered'},
        Cancelled:  {label: 'Đã hủy',        color: 'cancelled'},
    };

    meta(o: BillAdminUI) { return this.statusMeta[o.status as OrderStatus]; }

    private matchSearch = (o: BillAdminUI, q: string) =>
        !q || [o.customerFullName, o.customerPhone, o.billId, o.shippingAddress, o.paymentMethod]
            .some(v => (v ?? '').toString().toLowerCase().includes(q));

    activeOrders = computed(() => {
        // ... (code cũ giữ nguyên)
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isActive = o.status === 'Processing' ||
                o.status === 'Confirmed' ||
                o.status === 'Delivered' ||
                o.status === 'Assigned' ||
                o.status === 'Delivering';
            const pass = (sf === 'all' && isActive) || (sf === o.status);
            return isActive && pass && this.matchSearch(o, q);
        });
    });

    completedOrders = computed(() => {
        // ... (code cũ giữ nguyên)
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            const isDone = o.status === 'Succeed' || o.status === 'Cancelled';
            const pass = (sf === 'all' && isDone) || (sf === o.status);
            return isDone && pass && this.matchSearch(o, q);
        });
    });

    // ====== Lifecycle (Gọi API) ======
    ngOnInit(): void {
        // ... (code cũ giữ nguyên)
        this.loadData()
        combineLatest([
            this.billAdminService.getBillsForAdmin(),
            this.route.queryParams
        ]).subscribe(([bills, params]) => {
            this.orders.set(bills);

            const status = params['status'] as OrderStatus;
            if (status) { this.statusFilter.set(status); } else { this.statusFilter.set('all'); }
        });
    }

    loadData(): void {
        // ... (code cũ giữ nguyên)
        this.loading = true;
        this.errorMsg.set('');
        this.orders.set([]);
        this.staff.set([]);
        try {
            Promise.all([
                this.loadStaff(),
                this.loadBills()
            ]).catch(err => {
                console.error(err);
                this.errorMsg.set('Không thể tải dữ liệu. ' + (err.message || ''));
            }).finally(() => {
                this.loading = false;
            });
        } catch (err: any) {
            this.errorMsg.set('Lỗi không xác định khi tải dữ liệu.');
            this.loading = false;
        }
    }

    async loadBills(): Promise<void> {
        // ... (code cũ giữ nguyên)
        const bills = (await this.billAdminService.getBillsForAdmin().toPromise()) || [];
        const billsUI = bills.map(b => ({...b, _expanded: false} as BillAdminUI));
        this.orders.set(billsUI);
    }

    async loadStaff(): Promise<void> {
        // ... (code cũ giữ nguyên)
        const staffList = (await this.billAdminService.getStaffList().toPromise()) || [];
        this.staff.set(staffList);
    }

    // ====== Helpers / Actions (Cập nhật cho khớp) ======
    setFilter(status: OrderStatus | 'all'): void {
        // ... (code cũ giữ nguyên)
        this.statusFilter.set(status);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { status: status === 'all' ? null : status },
            queryParamsHandling: 'merge'
        });
    }

    toggleExpand(order: BillAdminUI): void {
        // ... (code cũ giữ nguyên)
        const found = this.orders().find(o => o.billId === order.billId);
        if (found) {
            found._expanded = !found._expanded;
            this.orders.set([...this.orders()]);
        }
    }

    trackOrder = (_: number, o: BillAdminUI) => o.billId;
    trackStaff = (_: number, s: StaffInfo) => s.id;

    getStaffLabel(staff: StaffInfo | null): string {
        // ... (code cũ giữ nguyên)
        if (!staff) return '— Chưa phân công —';
        return `${staff.fullName}${staff.phone ? ' (' + staff.phone + ')' : ''}`;
    }

    /** * HÀM (assignStaff) NÀY GIỜ CHỈ MỞ MODAL
     */
    assignStaff(order: BillAdminUI, event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const staffId = selectElement.value ? parseInt(selectElement.value, 10) : null;
        const staffName = selectElement.options[selectElement.selectedIndex]?.text || '';

        // 1. Thực hiện tất cả các kiểm tra
        if (order.status !== 'Confirmed') {
            this.showError('Chỉ có thể gán khi đơn hàng đã được xác nhận.');
            selectElement.value = order.staff ? order.staff.id.toString() : ''; // Reset
            return;
        }
        if (order.staff) {
            this.showError('Đơn đã phân công, không thể thay đổi.');
            selectElement.value = order.staff.id.toString(); // Reset
            return;
        }
        if (!staffId) return;

        // 2. Lưu thông tin để xác nhận
        this.orderToAssign.set(order);
        this.staffToAssign.set({
            id: staffId,
            name: staffName,
            element: selectElement
        });

        // 3. Mở Modal
        this.showAssignModal.set(true);
    }

    // ===== BẮT ĐẦU CODE MỚI: Các hàm xử lý Modal =====

    /**
     * HÀM MỚI: Đóng modal và reset dropdown (nếu cần)
     */
    closeAssignModal(resetDropdown: boolean = true) {
        if (resetDropdown) {
            const selectElement = this.staffToAssign()?.element;
            if (selectElement) {
                selectElement.value = ''; // Reset dropdown về "chọn"
            }
        }
        this.showAssignModal.set(false);
        this.orderToAssign.set(null);
        this.staffToAssign.set(null);
    }

    /**
     * HÀM MỚI: Logic gọi API (trước đây nằm trong assignStaff)
     */
    confirmAssignStaff() {
        const order = this.orderToAssign();
        const staffInfo = this.staffToAssign();

        if (!order || !staffInfo) return;

        this.loading = true;
        this.billAdminService.assignStaff(order.billId, staffInfo.id).subscribe({
            next: (updatedBill) => {
                this.orders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId
                            ? {...o, ...updatedBill, _expanded: o._expanded}
                            : o
                    )
                );
                this.loading = false;
                this.showSuccess('Đã phân công nhân viên.');
                // Đóng modal, không reset dropdown (vì đã gán thành công)
                this.closeAssignModal(false);
            },
            error: (err) => {
                this.loading = false;
                this.showError(err.message || 'Lỗi khi gán nhân viên.');
                // Đóng modal, reset dropdown (vì gán lỗi)
                this.closeAssignModal(true);
            }
        });
    }
    // ===== KẾT THÚC CODE MỚI =====


    private showSuccess(msg: string) {
        // ... (code cũ giữ nguyên)
        this.successMsg.set(msg);
        setTimeout(() => this.successMsg.set(''), 3000);
    }

    private showError(msg: string) {
        // ... (code cũ giữ nguyên)
        this.errorMsg.set(msg);
        setTimeout(() => this.errorMsg.set(''), 4000);
    }
}