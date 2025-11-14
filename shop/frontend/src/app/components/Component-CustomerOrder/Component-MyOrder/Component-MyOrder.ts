import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillService } from '../../../services/bill.service';
import { BillAdminDetailResponse, BillItem } from '../../../models/bill-admin.model';
import { StaffInfo } from '../../../models/staff-info.model';
export type OrderStatus = 'Processing' | 'Confirmed' | 'Assigned' | 'Delivering' | 'Delivered' | 'Succeed' | 'Cancelled';
export type OrderFilterStatus = OrderStatus | 'all';

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './Component-MyOrder.html',
    styleUrls: ['./Component-MyOrder.css']
})
export class ComponentMyOrderComponent implements OnInit {
    private billService = inject(BillService);

    loading = true;
    errorMsg = '';
    orders: BillAdminDetailResponse[] = [];
    busy: Record<string | number, boolean> = {};
    expanded: Record<string | number, boolean> = {};

    activeFilter: OrderFilterStatus = 'Confirmed';
    readonly statusTabs: { key: OrderFilterStatus, label: string }[] = [
        // { key: 'Processing', label: 'Đang Xử lý' },
        { key: 'Confirmed', label: 'Đã xác nhận' },
        { key: 'Assigned' , label: 'Đã bàn giao' },
        { key: 'Delivering', label: 'Đang vận chuyển' },
        { key: 'Delivered', label: 'Đã giao' },
        { key: 'Succeed', label: 'Hoàn thành' },
        { key: 'Cancelled', label: 'Đã hủy' },
    ];

    // Dùng 'getter' để tự động lọc danh sách 'orders'
    get filteredOrders(): BillAdminDetailResponse[] {
        if (this.activeFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(o => o.status === this.activeFilter);
    }

    // Hàm này được gọi bởi các nút (button) trong HTML
    setFilter(filter: OrderFilterStatus): void {
        this.activeFilter = filter;
    }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.errorMsg = '';
        this.billService.getMyOrders().subscribe({
            next: (data: any[]) => {
                this.orders = data.map(order => {
                    const details = order.products?.map((item: any) => {
                        return {
                            ...item,
                            price: item.unitPrice
                        };
                    }) || [];

                    return {
                        ...order,
                        details: details
                    };
                });
                this.loading = false;
            },
            error: (err: any) => {
                this.errorMsg = 'Không thể tải đơn hàng của bạn. Vui lòng thử lại.';
                this.loading = false;
                console.error(err);
            }
        });
    }

    trackById = (_: number, o: BillAdminDetailResponse) => o.billId;
    formatMoney(n: number) { return (n ?? 0).toLocaleString('vi-VN') + 'đ'; }

    displayPhone(p?: StaffInfo | null): string {
        return (p?.phone ?? '').trim();
    }
    safeTelHref(p?: StaffInfo | null): string | null {
        const digits = (p?.phone ?? '').toString().replace(/\D+/g, '');
        return digits ? `tel:${digits}` : null;
    }

    isExpanded(o: BillAdminDetailResponse): boolean { return !!this.expanded[o.billId]; }
    toggleExpand(o: BillAdminDetailResponse): void { this.expanded[o.billId] = !this.expanded[o.billId]; }

    firstItem(o: BillAdminDetailResponse): BillItem | null {
        const arr = o.details;
        return (arr && arr.length) ? arr[0] : null;
    }

    otherItems(o: BillAdminDetailResponse): BillItem[] {
        return o.details?.slice(1) ?? [];
    }

    /** Khóa hủy: (Sửa: dùng trạng thái backend) */
    isCancelLocked(o: BillAdminDetailResponse): boolean {
        const s = o.status;
        // Logic mới (từ service): Không thể hủy khi đang giao, đã giao, hoặc đã hủy
        return s === 'Delivering' || s ==='Delivered' || s === 'Succeed' || s === 'Cancelled';
    }

    /** * Hiển thị nút "Đã nhận hàng"
     * (Logic này khớp với ảnh chụp, khi đơn đang 'Delivering')
     */
    showConfirm(o: BillAdminDetailResponse): boolean {
        const s = o.status;
        return s === 'Delivered';
    }

    confirmReceived(o: BillAdminDetailResponse) {
        if (this.busy[o.billId] || o.status !== 'Delivered') return;

        this.busy[o.billId] = true;
        this.errorMsg = '';
        this.billService.confirmOrderReceived(o.billId).subscribe({
            next: (updatedBill) => {
                const i = this.orders.findIndex(x =>
                    x.billId === o.billId);
                if (i >= 0) {
                    this.orders[i] = updatedBill;
                }
                this.busy[o.billId] = false;
            },
            error: (err: any) => {
                this.errorMsg = err.error?.message || 'Xác nhận thất bại. Vui lòng thử lại.';
                this.busy[o.billId] = false;
            }
        });
    }

    cancelOrder(o: BillAdminDetailResponse) {
        if (this.isCancelLocked(o) || this.busy[o.billId]) return;
        const ok = window.confirm(`Bạn có chắc muốn hủy đơn hàng #${o.billId}?`);
        if (!ok) return;

        this.busy[o.billId] = true;
        this.errorMsg = '';

        this.billService.cancelOrder(o.billId).subscribe({
            next: () => {
                const i = this.orders.findIndex(x => x.billId === o.billId);
                if (i >= 0) this.orders[i] = { ...this.orders[i], status: 'Cancelled' };
                this.busy[o.billId] = false;
            },
            error: (err: any) => {
                this.errorMsg = err.error?.message || 'Hủy đơn thất bại. Vui lòng thử lại.';
                this.busy[o.billId] = false;
            }
        });
    }
}