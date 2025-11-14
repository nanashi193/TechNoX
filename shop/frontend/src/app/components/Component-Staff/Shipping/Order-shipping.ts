import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../../services/bill.service';
import { BillAdminResponse} from '../../../models/bill-admin.model';
import { StaffInfo } from '../../../models/staff-info.model';

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

    allOrders = signal<BillAdminResponse[]>([]);

    private filterOrders(orders: BillAdminResponse[]): BillAdminResponse[] {
        const q = this.query().trim().toLowerCase();
        if (!q) return orders;

        return orders.filter(o =>
            [o.customerFullName, o.customerPhone, o.billId, o.shippingAddress, o.paymentMethod]
                .some(v => (v ?? '').toString().toLowerCase().includes(q))
        );
    }

    assignedOrders = computed(() => {
        return this.filterOrders(
            this.allOrders().filter(o => o.status === 'Assigned')
        );
    });

    deliveringOrders = computed(() => {
        return this.filterOrders(
            this.allOrders().filter(o => o.status === 'Delivering')
        );
    });

    succeedOrders = computed(() => {
        return this.filterOrders(
            this.allOrders().filter(o => o.status === 'Delivered' || o.status === 'Succeed')
        );
    });

    ngOnInit(): void {
        this.loadMyOrders();
    }

    loadMyOrders(): void {
        this.loading.set(true);
        this.errorMsg.set('');

        this.billService.getMyAssignedOrders().subscribe({
            next: (orders) => {
                this.allOrders.set(orders);
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMsg.set('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
                this.loading.set(false);
                console.error(err);
            }
        });
    }

    acceptOrder(order: BillAdminResponse): void {
        this.loading.set(true);
        this.billService.acceptOrder(order.billId).subscribe({
            next: (updatedBill) => {
                // Cập nhật đơn hàng trong signal
                this.allOrders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId ? updatedBill : o
                    )
                );
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMsg.set('Chấp nhận thất bại: ' + (err.error?.message || 'Lỗi máy chủ'));
                this.loading.set(false);
            }
        });
    }

    declineOrder(order: BillAdminResponse): void {
        // Hỏi xác nhận trước khi từ chối
        if (!confirm(`Bạn có chắc muốn từ chối đơn hàng #${order.billId}? Đơn hàng sẽ được trả lại cho quản lý.`)) {
            return;
        }

        this.loading.set(true);
        this.billService.declineOrder(order.billId).subscribe({
            next: (updatedBill) => {
                this.allOrders.update(currentOrders =>
                    currentOrders.filter(o => o.billId !== order.billId)
                );
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMsg.set('Từ chối thất bại: ' + (err.error?.message || 'Lỗi máy chủ'));
                this.loading.set(false);
            }
        });
    }

    markAsCompleted(order: BillAdminResponse): void {
        // Sửa: Đổi tên hàm từ service cho đúng
        this.loading.set(true);
        this.billService.completeOrder(order.billId).subscribe({
            next: (updatedBill) => {
                this.allOrders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId ? updatedBill : o
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
