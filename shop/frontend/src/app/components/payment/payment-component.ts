import { Component, OnInit } from '@angular/core';
// Thêm CurrencyPipe
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
// Sửa lại đường dẫn import và thêm PayOSLinkResponse
import { PaymentService, PayOSLinkResponse } from '../../services/payment.service';

type PayMethod = 'COD' | 'BANK';

interface CartItem { id: string; name: string; price: number; qty: number; }
interface User { id: string; fullName: string; email?: string; }
interface Customer { address?: string; phone?: string; }

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, RouterModule, HttpClientModule, CurrencyPipe],
    providers: [PaymentService],
    templateUrl: './payment-component.html',
    styleUrls: ['./payment-component.css']
})
export class PaymentComponent implements OnInit {
    // UI
    loading = false;
    pLoading = false;

    // data
    items: CartItem[] = [];
    currentUser: User | null = { id: '', fullName: '', email: '' };
    customer: Customer | null = { address: '', phone: ''};
    orderId: string | null = null; // Đây chính là billId

    method: PayMethod = 'COD';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private paymentService: PaymentService // Đã inject service
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
            const raw = sessionStorage.getItem('orderDraft');
            if (!raw) {
                console.warn('Không tìm thấy "orderDraft" trong sessionStorage.');
                return;
            }

            const draft = JSON.parse(raw);
            if (Array.isArray(draft?.fullItems) && this.items.length === 0) {
                this.items = draft.fullItems.map((x: any) => ({
                    id: x.variantId?.toString() ?? crypto.randomUUID(),
                    name: x.productName ?? 'Sản phẩm',
                    price: Number(x.unitPrice) || 0, // Sửa từ price -> unitPrice
                    qty: Number(x.quantity) || 1,
                }));
            }

            if (this.currentUser) {
                this.currentUser.fullName = draft.FullName || '';
                this.currentUser.email = draft.Email || '';
            }
            if (this.customer) {
                this.customer.address = draft.ShippingAddress || '';
                this.customer.phone = draft.Phone || '';
            }

        } catch (e) {
            console.error('Lỗi đọc dữ liệu từ sessionStorage:', e);
        }
    }

    async refresh(): Promise<void> {
        this.loading = true;
        try {
            try {
                const u = await firstValueFrom(this.paymentService.getMe());
                if (u) {
                    this.currentUser = { ...this.currentUser, ...u };
                }
            } catch (e) {
                console.warn('Không thể tải thông tin user:', e);
            }
        } finally {
            this.loading = false;
        }
    }

    onMethodChange(m: PayMethod): void { this.method = m; }

    async goPayOS(): Promise<void> {
        // QUAN TRỌNG: Cần lấy Order ID (billId)
        // Hiện tại this.orderId đang được lấy từ query param (ngOnInit)
        // Nếu trang trước KHÔNG đẩy orderId qua URL, code này sẽ thất bại.

        if (!this.orderId) {
            // Thử lấy ID từ draft (nếu trang detail có lưu)
            const raw = sessionStorage.getItem('orderDraft');
            if (raw) this.orderId = JSON.parse(raw)?.id;
        }

        if (!this.orderId || this.pLoading) {
            alert('Không tìm thấy mã đơn hàng (orderId).');
            return;
        }

        this.pLoading = true;
        try {
            const { checkoutUrl }: PayOSLinkResponse = await firstValueFrom(
                this.paymentService.createPayOSLink(this.orderId)
            );

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                alert('Không tạo được link thanh toán. Vui lòng thử lại.');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi: Không tạo được link thanh toán. Vui lòng thử lại.');
        } finally {
            this.pLoading = false;
        }
    }

    confirmCOD(): void {
        alert('Đã tạo đơn COD. Chúng tôi sẽ liên hệ giao hàng.');
        sessionStorage.removeItem('orderDraft'); // Xóa đơn nháp
        this.router.navigate(['/home']);
    }

    trackByCartItem = (_: number, it: CartItem) => it.id;
}

