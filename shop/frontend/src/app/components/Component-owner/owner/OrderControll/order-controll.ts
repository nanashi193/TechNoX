import {Component, OnInit, signal, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {BillAdminResponse} from '../../../../models/bill-admin.model';
import {StaffInfo} from '../../../../models/staff-info.model';
import {AssignStaffRequest} from '../../../../models/assign-staff-request.model';
import {BillAdminService} from "../../../../services/bill-admin.service";
import {Router} from "@angular/router";

export type OrderStatus = 'Processing' | 'Confirmed' | 'Delivering' | 'Delivered' | 'Succeed' | 'Cancelled';
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

    //orders-detail
    goDetail(o: BillAdminUI) {
        this.router.navigate(['/owner/orders', o.billId]);
    }

    goDetailFromEvent(ev: MouseEvent, o: BillAdminUI) {
        const el = ev.target as HTMLElement;
        const tag = el.tagName;
        if (['A', 'BUTTON', 'SELECT', 'OPTION', 'INPUT', 'TEXTAREA', 'LABEL'].includes(tag)) return;
        this.goDetail(o);
    }


    loading = false;
    errorMsg = signal('');   // Dùng signal để tự động cập nhật
    successMsg = signal(''); // Dùng signal để tự động cập nhật

    orders = signal<BillAdminUI[]>([]);
    staff = signal<StaffInfo[]>([]);
    statusFilter = signal<'all' | OrderStatus>('all'); // (Lỗi 1 đã được sửa)
    search = signal<string>('');

    readonly statusMeta: Record<OrderStatus, { label: string; color: string }> = {
        Processing: {label: 'Đang xử lý',     color: 'processing'},
        Confirmed:  {label: 'Đã xác nhận',   color: 'paid'},
        Delivering: {label: 'Đang vận chuyển', color: 'Delivering'},
        Delivered:  {label: 'Đã giao (Chờ KH)', color: 'processing'},
        Succeed:    {label: 'Hoàn tất',      color: 'delivered'},
        Cancelled:  {label: 'Đã hủy',        color: 'cancelled'},
    };

    meta(o: BillAdminUI) {
        return this.statusMeta[o.status as OrderStatus];
    }

    private matchSearch = (o: BillAdminUI, q: string) =>
        !q || [o.customerFullName, o.customerPhone, o.billId, o.shippingAddress, o.paymentMethod]
            .some(v => (v ?? '').toString().toLowerCase().includes(q));

    // ====== Phân nhóm hiển thị (Cập nhật logic status) ======
    activeOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            // SỬA: Bỏ 'Delivered' ra khỏi Đơn hiện tại
            const isActive = o.status === 'Processing' || o.status === 'Confirmed' ||
                o.status === 'Delivering';
            const pass = (sf === 'all' && isActive) || (sf === o.status);
            return isActive && pass && this.matchSearch(o, q);
        });
    });

    completedOrders = computed(() => {
        const q = this.search().trim().toLowerCase();
        const sf = this.statusFilter();
        return this.orders().filter(o => {
            // SỬA: Thêm 'Delivered' vào Đơn đã xử lý
            const isDone = o.status === 'Delivered' || o.status === 'Succeed' || o.status === 'Cancelled';
            const pass = (sf === 'all' && isDone) || (sf === o.status);
            return isDone && pass && this.matchSearch(o, q);
        });
    });

    // ====== Lifecycle (Gọi API) ======
    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.errorMsg.set('');

        // Reset
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
        const bills = (await this.billAdminService.getBillsForAdmin().toPromise()) || [];
        // Gán _expanded cho UI (Sửa lỗi 4: ép kiểu sang BillAdminUI)
        const billsUI = bills.map(b => ({...b, _expanded: false} as BillAdminUI));
        this.orders.set(billsUI);
    }

    async loadStaff(): Promise<void> {
        const staffList = (await this.billAdminService.getStaffList().toPromise()) || [];
        this.staff.set(staffList);
    }


    // ====== Helpers / Actions (Cập nhật cho khớp) ======
    setFilter(v: 'all' | OrderStatus): void {
        this.statusFilter.set(v);
    } // (Lỗi 1 đã được sửa)

    toggleExpand(order: BillAdminUI): void {
        const found = this.orders().find(o => o.billId === order.billId);
        if (found) {
            found._expanded = !found._expanded; // (Lỗi 4 đã được sửa)
            this.orders.set([...this.orders()]);
        }
    }

    trackOrder = (_: number, o: BillAdminUI) => o.billId; // (Sửa lỗi 4)
    trackStaff = (_: number, s: StaffInfo) => s.id;

    getStaffLabel(staff: StaffInfo | null): string {
        if (!staff) return '— Chưa phân công —';
        return `${staff.fullName}${staff.phone ? ' (' + staff.phone + ')' : ''}`;
    }

    /** * Gán Staff (Gọi API)
     * KHÓA: nếu đã có order.staff (backend trả về object) thì không cho đổi nữa
     */
    assignStaff(order: BillAdminUI, event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const staffId = selectElement.value ? parseInt(selectElement.value, 10) : null;

        if (order.status === 'Succeed' || order.status === 'Cancelled') return; // Đơn đã xong -> không đổi
        if (order.staff) { // Đã phân công rồi -> chặn (backend trả về staff object)
            this.showError('Đơn đã phân công, không thể thay đổi.');
            // Reset dropdown về giá trị cũ
            selectElement.value = order.staff.id.toString();
            return;
        }
        if (!staffId) return;

        this.loading = true;
        this.billAdminService.assignStaff(order.billId, staffId).subscribe({
            next: (updatedBill) => {
                // 7. Cập nhật lại đơn hàng trong signal
                this.orders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId
                            ? {...o, ...updatedBill, _expanded: o._expanded} // (Lỗi 4 đã được sửa)
                            : o
                    )
                );
                this.loading = false;
                this.showSuccess('Đã phân công nhân viên.');
            },
            error: (err) => {
                this.loading = false;
                this.showError(err.message || 'Lỗi khi gán nhân viên.');
                // Reset dropdown về "chưa phân công"
                selectElement.value = '';
            }
        });
    }

    private showSuccess(msg: string) {
        this.successMsg.set(msg);
        setTimeout(() => this.successMsg.set(''), 3000);
    }

    private showError(msg: string) {
        this.errorMsg.set(msg);
        setTimeout(() => this.errorMsg.set(''), 4000);
    }
}
