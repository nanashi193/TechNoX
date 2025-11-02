import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

interface Merchant {
    bank: string;
    accountNumber: string;
    accountName: string;
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
    qLoading = false;

    // data
    currentUser: User | null = null;
    customer: Customer | null = null;

    items: CartItem[] = [];
    orderId: string | null = null;

    method: PayMethod = 'COD';

    // QR
    qrSrc: string | null = null;
    qError: string | null = null;

    merchant: Merchant = {
        bank: 'MB Bank',
        accountNumber: '0853907917',
        accountName: 'TECHNOX CO., LTD',
    };

    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute
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

    refresh(): void {
        this.loading = true;
        this.qError = null;

        const tasks: Promise<any>[] = [];

        // 1) Cart
        tasks.push(
            firstValueFrom(this.http.get<CartItem[]>('/api/cart'))
                .then((list) => {
                    if (Array.isArray(list) && list.length) {
                        this.items = list.map((it) => ({
                            id: it.id,
                            name: it.name,
                            price: Number(it.price) || 0,
                            qty: Number(it.qty) || 1,
                        }));
                    }
                })
                .catch(() => {})
        );

        // 2) User
        tasks.push(
            firstValueFrom(this.http.get<User>('/api/me'))
                .then((u) => {
                    this.currentUser = u ?? this.currentUser;
                })
                .catch(() => {})
        );

        // 3) Customer snapshot
        tasks.push(
            firstValueFrom(this.http.get<Customer>('/api/customer'))
                .then((c) => {
                    this.customer = c ?? this.customer;
                })
                .catch(() => {})
        );

        Promise.all(tasks).finally(() => {
            this.loading = false;
            if (this.method === 'BANK') this.generateQR();
        });
    }

    onMethodChange(m: PayMethod): void {
        this.method = m;
        if (m === 'BANK') this.generateQR();
        else {
            this.qrSrc = null;
            this.qError = null;
        }
    }

    private buildAddInfo(): string {
        const id = this.orderId ?? 'DON_' + new Date().getTime();
        return `Thanh toan ${id}`;
    }

    private buildQrUrl(): string {
        const amount = Math.max(0, Math.floor(this.subtotal));
        const addInfo = encodeURIComponent(this.buildAddInfo());
        const acc = this.merchant.accountNumber.replace(/\s+/g, '');
        return `https://img.vietqr.io/image/MB-${acc}-compact2.png?amount=${amount}&addInfo=${addInfo}`;
    }

    generateQR(): void {
        this.qLoading = true;
        this.qError = null;

        try {
            this.qrSrc = this.buildQrUrl();
            const img = new Image();
            img.onload = () => (this.qLoading = false);
            img.onerror = () => {
                this.qLoading = false;
                this.qError = 'Không tải được QR, thử lại.';
                this.qrSrc = null;
            };
            img.src = this.qrSrc;
        } catch {
            this.qLoading = false;
            this.qError = 'Không tạo được QR.';
            this.qrSrc = null;
        }
    }

    printQR(): void {
        if (!this.qrSrc) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(
            `<img src="${this.qrSrc}" alt="VietQR" style="max-width:100%"/><script>window.onload=()=>window.print()</script>`
        );
        w.document.close();
    }

    copyAddInfo(): void {
        const text = this.buildAddInfo();
        navigator.clipboard?.writeText(text).catch(() => {});
    }

    confirmCOD(): void {
        // TODO: call API xác nhận COD nếu có
        alert('Đã tạo đơn COD. Chúng tôi sẽ liên hệ giao hàng.');
        this.router.navigate(['/home']);
    }

    trackByCartItem = (_: number, it: CartItem) => it.id;
}
