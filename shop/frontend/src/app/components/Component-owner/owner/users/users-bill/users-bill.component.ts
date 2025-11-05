import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillAdminService } from '../../../../../services/bill-admin.service';
import { BillAdminResponse } from '../../../../../models/bill-admin.model';

type Row = {
    id: number;
    date: Date | null;
    paymentStatus: 'Paid' | 'Pending' | 'Cancelled';
    total: number;
};

@Component({
    standalone: true,
    selector: 'owner-users-bill',
    imports: [CommonModule, NgIf, NgFor, RouterLink, DatePipe, CurrencyPipe],
    templateUrl: './users-bill.component.html',
    styleUrl: './users-bill.component.css'
})
export class UserBillComponent implements OnChanges {
    @Input({ required: true }) userId!: number;

    private svc = inject(BillAdminService);

    loading = signal(false);
    rows = signal<Row[]>([]);
    totalItems = signal(0);

    ngOnChanges(_: SimpleChanges): void {
        if (!this.userId) return;
        this.load();
    }

    private paymentBadgeFromFields(status?: string, paymentStatus?: string): 'Paid' | 'Pending' | 'Cancelled' {
        const ps = (paymentStatus ?? '').toUpperCase();
        if (ps === 'PAID' || ps === 'SUCCESS') return 'Paid';
        if (ps === 'CANCELLED' || ps === 'REFUNDED' || ps === 'FAILED') return 'Cancelled';
        // fallback theo status đơn
        const s = (status ?? '').toUpperCase();
        if (s === 'PAID' || s === 'COMPLETED' || s === 'DELIVERED' || s === 'CONFIRMED') return 'Paid';
        if (s === 'CANCELLED' || s === 'RETURNED' || s === 'FAILED') return 'Cancelled';
        return 'Pending';
    }

    private map(b: BillAdminResponse): Row {
        return {
            id: b.billId,
            date: b.orderDate ? new Date(b.orderDate as any) : null,
            paymentStatus: this.paymentBadgeFromFields(b.status, (b as any).paymentStatus),
            total: b.total ?? 0
        };
    }

    load() {
        this.loading.set(true);
        this.svc.getBillsByUser(this.userId, { sort: 'created_desc', page: 1, limit: 10 }).subscribe({
            next: res => {
                const rows = (res.items ?? []).map(b => this.map(b));
                this.rows.set(rows);
                this.totalItems.set(res.totalItems ?? rows.length);
                this.loading.set(false);
            },
            error: _ => {
                this.rows.set([]);
                this.totalItems.set(0);
                this.loading.set(false);
            }
        });
    }

    badgeClass(ps: Row['paymentStatus']) {
        return ps === 'Paid' ? 'ok' : (ps === 'Pending' ? 'warn' : 'danger');
    }
}
