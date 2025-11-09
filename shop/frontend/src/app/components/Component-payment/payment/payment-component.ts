import { Component, OnInit } from '@angular/core';
// Thêm CurrencyPipe
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PaymentService, PayOSLinkResponse, UserAPI } from '../../../services/payment.service';
import { BillResponse } from '../../../models/bill.model';


type PayMethod = 'COD' | 'BANK';

interface CartItem { id: string; name: string; price: number; qty: number; }
interface Customer { address?: string; phone?: string; }

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, RouterModule, CurrencyPipe],
    providers: [PaymentService],
    templateUrl: './payment-component.html',
    styleUrls: ['./payment-component.css']
})
export class PaymentComponent implements OnInit {
    // UI
    loading = false;
    pLoading = false;
    codError: string | null = null;
    items: CartItem[] = [];
    currentUser: UserAPI | null = null;

    customer: Customer | null = { address: '', phone: ''};
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

            if (!this.orderId) {
                this.hydrateOrderIdFromLocal();
            }
        });
        this.hydrateFromLocal();
    }

    private hydrateOrderIdFromLocal(): void {
        try {
            const raw = sessionStorage.getItem('orderDraft');
            if (raw) {
                const draft = JSON.parse(raw);
                if (draft.id) {
                    this.orderId = draft.id.toString();
                }
            }
        } catch(e) {
            console.error("Lỗi đọc orderId từ draft", e);
        }
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

            if (!this.currentUser) {
                this.currentUser = {
                    UserId: '0',
                    FullName: '',
                    email: ''
                };
            }

            if (this.currentUser) {
                this.currentUser.FullName = draft.FullName || '';
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

    onMethodChange(m: PayMethod): void { this.method = m; }

    async goPayOS(): Promise<void> {
        if (!this.orderId) {
            this.hydrateOrderIdFromLocal();
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
        } catch (e: any) {
            console.error(e);
            alert(`Lỗi: ${e.message || 'Không tạo được link thanh toán.'}`);
        } finally {
            this.pLoading = false;
        }
    }
    confirmCOD(): void {
        if (!this.orderId) {
            this.hydrateOrderIdFromLocal();
        }

        if (!this.orderId) {
            this.codError = 'Không tìm thấy mã đơn hàng. Vui lòng tải lại trang.';
            return;
        }
        this.loading = true;
        this.codError = null;
        this.paymentService.confirmCOD(this.orderId).subscribe({
            next: (response: BillResponse) => {
                // THÀNH CÔNG
                this.loading = false;
                console.log('Xác nhận COD thành công', response);
                alert('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.');

                sessionStorage.removeItem('orderDraft');
                this.router.navigate(['/']);
            },
            error: (err) => {
                // THẤT BẠI
                this.loading = false;
                console.error('Lỗi khi xác nhận COD:', err);
                this.codError = err.message || 'Lỗi không xác định. Vui lòng thử lại.';
            }
        });
    }
    trackByCartItem = (_: number, it: CartItem) => it.id;
}

