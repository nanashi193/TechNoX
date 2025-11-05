import {Component, OnInit, inject, signal, computed} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe, NgIf, NgFor, NgClass} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {BillAdminService} from '../../../../../services/bill-admin.service';
import {BillAdminDetailResponse, BillAdminResponse, BillItem} from '../../../../../models/bill-admin.model';

type ItemRow = {
    id: number;
    name: string;
    color?: string;
    size?: string;
    qty: number;
    price: number;
    amount: number;
    thumb?: string;
};

@Component({
    standalone: true,
    selector: 'owner-orders-detail',
    imports: [CommonModule, NgIf, NgFor, NgClass, RouterLink, DatePipe, CurrencyPipe],
    templateUrl: './orders-detail.component.html',
    styleUrl: './orders-detail.component.css'
})export class OrdersDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private svc = inject(BillAdminService);

    loading = signal(true);
    err = signal<string | null>(null);
    bill = signal<BillAdminDetailResponse | null>(null);

    // ===== Computed for UI =====
    billNo = computed(() => {
        const b = this.bill();
        if (!b) return '—';
        const id = b.billId;
        const src = b.code ?? '';
        const digits = (src.match(/\d+$/) ?? [])[0] ?? String(id ?? '');
        return digits ? `#${digits}` : (id ? `#${id}` : '#—');
    });

    items = computed<ItemRow[]>(() => {
        const arr = this.bill()?.details ?? [];
        return arr.map((d: BillItem) => ({
            id: d.VariantId ?? d.ProductId,
            name: d.ProductName,
            color: d.Color,
            size: d.Size,
            qty: d.Quantity,
            price: d.Price ?? 0,
            amount: (d.Price ?? 0) * (d.Quantity ?? 0),
            thumb: d.Thumbnail
        }));
    });

    subtotal = computed(() =>
        this.bill()?.subtotal ?? this.items().reduce((s, it) => s + it.amount, 0)
    );
    shippingFee = computed(() => this.bill()?.shippingFee ?? 0);
    tax = computed(() => this.bill()?.tax ?? 0);
    discount = computed(() => this.bill()?.discount ?? 0);

    total = computed(() => {
        const b = this.bill();
        if (b?.total != null) return b.total;
        return this.subtotal() + this.shippingFee() + this.tax() - this.discount();
    });

    paid = computed(() => {
        const b = this.bill();
        if (!b) return 0;
        if (b.paidAmount != null) return b.paidAmount;
        return (b.status?.toUpperCase() === 'PAID') ? this.total() : 0;
    });

    // ===== Lifecycle =====
    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.err.set('Bill id không hợp lệ');
            this.loading.set(false);
            return;
        }

        this.svc.getById(id).subscribe({
            next: (res) => { this.bill.set(res); this.loading.set(false); },
            error: (_e) => { this.err.set('Không tải được chi tiết hoá đơn'); this.loading.set(false); }
        });
    }

    trackItem = (_: number, it: ItemRow) => it.id;

    badgeClass(status?: string) {
        const s = (status ?? '').toUpperCase();
        if (s === 'PAID' || s === 'CONFIRMED' || s === 'DELIVERED') return 'ok';
        if (s === 'CREATED' || s === 'SHIPPING' || s === 'PENDING') return 'warn';
        if (s === 'CANCELLED' || s === 'RETURNED' || s === 'FAILED') return 'danger';
        return '';
    }
}
