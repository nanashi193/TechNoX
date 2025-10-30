import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from './payment-service';

type PayMethod = 'COD' | 'BANK';

interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

interface User {
    id: string;
    fullName: string;
    email?: string;
}

interface Customer {
    cccd?: string;
    address?: string;
}

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, RouterModule, HttpClientModule],
    templateUrl: './payment-component.html',
    styleUrls: ['./payment-component.css'],
})
export class PaymentComponent implements OnInit {
    // UI state
    loading = false;
    pLoading = false;

    // data
    currentUser: User | null = null;
    customer: Customer | null = null;

    items: CartItem[] = [];
    orderId: string | null = null;

    method: PayMethod = 'COD';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private paymentService: PaymentService
    ) {}

    get subtotal(): number {
        return this.items.reduce((s, it) => s + it.price * it.qty, 0);
    }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe((q) => {
            const id = q.get('orderId');
            if (id) this.orderId = id;
        });

        this.hydrateFromLocal();
        this.refresh();
    }

    private hydrateFromLocal(): void {
        try {
            const raw = localStorage.getItem('orderDraft');
            if (!raw) return;
            const draft = JSON.parse(raw);

            if (draft?.id && !this.orderId) this.orderId = draft.id;

            if (Array.isArray(draft?.items) && this.items.length === 0) {
                this.items = draft.items.map((x: any) => ({
                    id: x.id ?? crypto.randomUUID(),
                    name: x.productName ?? x.name ?? 'Sản phẩm',
                    price: Number(x.price) || 0,
                    qty: Number(x.quantity ?? x.qty) || 1,
                }));
            }

            if (draft?.customer) {
                this.customer = {
                    cccd: draft.customer.cccd,
                    address: draft.customer.address,
                };
            }
        } catch {}
    }

    async refresh(): Promise<void> {
        this.loading = true;
        try {
            // 1) Cart
            try {
                const list = await firstValueFrom(this.paymentService.getCart());
                if (Array.isArray(list) && list.length) {
                    this.items = list.map((it) => ({
                        id: it.id,
                        name: it.name,
                        price: Number(it.price) || 0,
                        qty: Number(it.qty) || 1,
                    }));
                }
            } catch {}

            // 2) User
            try {
                const u = await firstValueFrom(this.paymentService.getMe());
                this.currentUser = u ?? this.currentUser;
            } catch {}

            // 3) Customer snapshot
            try {
                const c = await firstValueFrom(this.paymentService.getCustomer());
                this.customer = c ?? this.customer;
            } catch {}
        } finally {
            this.loading = false;
        }
    }

    onMethodChange(m: PayMethod): void {
        this.method = m;
    }

    private toOrderCode(): number {
        // PayOS yêu cầu orderCode là số nguyên dương & duy nhất
        // Lấy số trong orderId; nếu không có thì dùng timestamp
        const num = Number(this.orderId?.toString().replace(/\D+/g, ''));
        return Number.isFinite(num) && num > 0 ? num : Date.now();
    }

    async goPayOS(): Promise<void> {
        if (!this.items?.length || this.subtotal <= 0 || this.pLoading) return;

        this.pLoading = true;
        try {
            const orderCode = this.toOrderCode();

            const payload = {
                orderCode,
                amount: Math.round(this.subtotal),
                description: `Thanh toan ${this.orderId || orderCode}`,
                returnUrl: `${location.origin}/payment/success?orderId=${this.orderId || orderCode}`,
                cancelUrl: `${location.origin}/payment/cancel?orderId=${this.orderId || orderCode}`,
                items: this.items.map((it) => ({
                    name: it.name,
                    quantity: it.qty,
                    price: Math.round(it.price),
                })),
                buyer: {
                    name: this.currentUser?.fullName,
                    address: this.customer?.address,
                    email: this.currentUser?.email,
                },
            };

            const { checkoutUrl } = await firstValueFrom(
                this.paymentService.createPayOSLink(payload)
            );

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                alert('Không tạo được link thanh toán. Vui lòng thử lại.');
            }
        } catch (e) {
            console.error(e);
            alert('Không tạo được link thanh toán. Vui lòng thử lại.');
        } finally {
            this.pLoading = false;
        }
    }

    confirmCOD(): void {
        // TODO: gọi API xác nhận COD nếu có
        alert('Đã tạo đơn COD. Chúng tôi sẽ liên hệ giao hàng.');
        this.router.navigate(['/home']);
    }

    trackByCartItem = (_: number, it: CartItem) => it.id;
}
