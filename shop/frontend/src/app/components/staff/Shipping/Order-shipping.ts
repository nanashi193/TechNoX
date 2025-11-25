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

    showDeclineModal = signal(false);
    orderToDecline = signal<BillAdminResponse | null>(null);
    showCompleteModal = signal(false);
    orderToComplete = signal<BillAdminResponse | null>(null);
    selectedImagePreview = signal<string | null>(null);

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
        this.orderToDecline.set(order);
        this.showDeclineModal.set(true);
    }

    closeDeclineModal() {
        this.showDeclineModal.set(false);
        this.orderToDecline.set(null);
    }

    confirmDeclineOrder() {
        const order = this.orderToDecline();
        if (!order) return;

        this.loading.set(true);
        this.billService.declineOrder(order.billId).subscribe({
            next: (updatedBill) => {
                this.allOrders.update(currentOrders =>
                    currentOrders.filter(o => o.billId !== order.billId)
                );
                this.loading.set(false);
                this.closeDeclineModal();
            },
            error: (err) => {
                this.errorMsg.set('Từ chối thất bại: ' + (err.error?.message || 'Lỗi máy chủ'));
                this.loading.set(false);
                this.closeDeclineModal();
            }
        });
    }

    markAsCompleted(order: BillAdminResponse): void {
        if (order.status !== 'Delivering') return;

        this.orderToComplete.set(order);
        this.selectedImagePreview.set(null);
        this.showCompleteModal.set(true);
    }

    closeCompleteModal() {
        this.showCompleteModal.set(false);
        this.orderToComplete.set(null);
        this.selectedImagePreview.set(null);
    }

    onFileSelected(event: Event): void {
        const element = event.target as HTMLInputElement;
        const file = element.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.selectedImagePreview.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            this.selectedImagePreview.set(null);
        }
    }

    confirmCompleteOrder() {
        const order = this.orderToComplete();
        if (!order) return;

        if (!this.selectedImagePreview()) {
            this.errorMsg.set('Vui lòng đính kèm ảnh xác nhận.');
            setTimeout(() => this.errorMsg.set(''), 3000);
            return;
        }

        this.loading.set(true);
        this.billService.completeOrder(order.billId).subscribe({
            next: (updatedBill) => {
                this.allOrders.update(currentOrders =>
                    currentOrders.map(o =>
                        o.billId === updatedBill.billId ? updatedBill : o
                    )
                );
                this.loading.set(false);
                this.closeCompleteModal(); // Đóng modal khi thành công
            },
            error: (err) => {
                this.errorMsg.set('Cập nhật thất bại: ' + (err.error?.message || 'Lỗi máy chủ'));
                this.loading.set(false);
                // (Không đóng modal khi lỗi, để user thử lại)
            }
        });
    }

    getStaffLabel(staff: StaffInfo | null): string {
        if (!staff) return '—';
        return `${staff.fullName}${staff.phone ? ' (' + staff.phone + ')' : ''}`;
    }
}