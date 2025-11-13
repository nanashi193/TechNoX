import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill.service';
import { BillAdminResponse} from '../../../models/bill-admin.model';
import { StaffInfo } from '../../../models/staff-info.model';

interface BillAdminUI extends BillAdminResponse {
    _expanded?: boolean;
    _isAccepted?: boolean;
}

@Component({
    selector: 'app-staff-delivery',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: 'Order-shipping.html',
    styleUrls: ['Order-shipping.css']
})
export class OrderShippingComponent implements OnInit {

    private billService = inject(BillService);

    loading = signal(false);
    errorMsg = signal('');
    query = signal('');

    allOrders = signal<BillAdminUI[]>([]);

    private filterOrders(orders: BillAdminUI[]): BillAdminUI[] {
        const q = this.query().trim().toLowerCase();
        if (!q) return orders;

        return orders.filter(o =>
            [o.customerFullName, o.customerPhone, o.billId, o.shippingAddress, o.paymentMethod]
                .some(v => (v ?? '').toString().toLowerCase().includes(q))
        );
    }

    assignedOrders = computed(() => {
        return this.filterOrders(
            this.allOrders().filter(o => !o._isAccepted)
        );
    });

    deliveringOrders = computed(() => {
        return this.filterOrders(
            this.allOrders().filter(o => o._isAccepted)
        );
    });

    succeedOrders = computed(() => {
        const succeed = this.allOrders().filter(o => o.status === 'Delivered' || o.status === 'Succeed');
        return this.filterOrders(succeed);
    });

    ngOnInit(): void {
        this.loadMyOrders();
    }

    loadMyOrders(): void {
        this.loading.set(true);
        this.errorMsg.set('');

        this.billService.getMyAssignedOrders().subscribe({
            next: (orders) => {
                // Khởi tạo _isAccepted = false cho tất cả đơn
                const processedOrders = orders.map(o => ({
                    ...o,
                    _isAccepted: false
                })) as BillAdminUI[];

                this.allOrders.set(processedOrders);
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMsg.set('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
                this.loading.set(false);
                console.error(err);
            }
        });
    }

    acceptOrder(order: BillAdminUI): void {
        this.allOrders.update(currentOrders =>
            currentOrders.map(o =>
                o.billId === order.billId
                    ? { ...o, _isAccepted: true }
                    : o
            )
        );
    }

    declineOrder(order: BillAdminUI): void {
        this.allOrders.update(currentOrders =>
            currentOrders.filter(o => o.billId !== order.billId)
        );
    }

    markAsCompleted(order: BillAdminUI): void {
        if (order.status !== 'Delivering') return;

        this.loading.set(true);
        this.billService.completeOrder(order.billId).subscribe({
            next: (updatedBill) => {
                this.allOrders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId ? (updatedBill as BillAdminUI) : o
                    )
                );
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMsg.set('Cập nhật thất bại: ' + (err.error?.message || 'Lỗi máy chủ'));
                this.loading.set(false);
            }
        });
    }

    getStaffLabel(staff: StaffInfo | null): string {
        if (!staff) return '—';
        return `${staff.fullName}${staff.phone ? ' (' + staff.phone + ')' : ''}`;
    }
}
