import {Component, OnInit, inject, signal, computed} from '@angular/core';
import {CommonModule, CurrencyPipe, DatePipe, NgIf, NgFor, NgClass, NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {BillAdminService} from '../../../../services/bill-admin.service';
import {BillAdminDetailResponse, BillItem} from '../../../../models/bill-admin.model';


@Component({
    standalone: true,
    selector: 'owner-orders-detail',
    imports: [CommonModule, NgIf, NgFor, NgClass, RouterLink, DatePipe, CurrencyPipe, NgOptimizedImage],
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

    items = computed<BillItem[]>(() => (this.bill()?.details ?? (this.bill() as any)?.products ?? []));
    //helper
    itemId = (it: BillItem) => it.variantId ?? it.productId;
    itemAmount = (it: any) => (it.Price ?? it.unitPrice ?? 0) * (it.Quantity ?? it.quantity ?? 0);

    subtotal = computed(() =>
        this.bill()?.subtotal ?? this.items().reduce((s, it) => s + this.itemAmount(it), 0)
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
        const id = Number(this.route.snapshot.paramMap.get('billId'));
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

    trackItem = (_: number, it: BillItem) => this.itemId(it);

    badgeClass(status?: string) {
        const s = (status ?? '').toUpperCase();
        if (s === 'PAID' || s === 'CONFIRMED' || s === 'DELIVERED') return 'ok';
        if (s === 'CREATED' || s === 'SHIPPING' || s === 'PENDING') return 'warn';
        if (s === 'CANCELLED' || s === 'RETURNED' || s === 'FAILED') return 'danger';
        return '';
    }
}
