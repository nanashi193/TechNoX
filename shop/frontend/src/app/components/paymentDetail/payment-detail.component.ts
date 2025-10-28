import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface CartItem {
    productName: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    customer: { name: string; phone: string; address: string };
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
}

const PHONE_REGEX = /^(0|\+84)(\d){9,10}$/; // đơn giản, đủ dùng VN
const TAX_RATE = 0.1; // 10% VAT

@Component({
    selector: 'app-payment-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
    templateUrl: './payment-detail.component.html',
    styleUrl: './payment-detail.component.css'
})
export class PaymentDetailComponent implements OnInit {
    form!: FormGroup;

    // orderId sẽ được backend trả về khi tạo order
    orderId = signal<string | null>(null);

    // tổng tiền động dựa vào form items
    subtotal = computed(() =>
        this.items.controls.reduce((sum, ctrl) => {
            const p = Number(ctrl.get('price')?.value || 0);
            const q = Number(ctrl.get('quantity')?.value || 0);
            return sum + p * q;
        }, 0)
    );
    tax = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
    total = computed(() => +(this.subtotal() + this.tax()).toFixed(2));

    loading = false;
    loadError: string | null = null;

    constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            customer: this.fb.group({
                name: ['', [Validators.required, Validators.minLength(2)]],
                phone: ['', [Validators.required, Validators.pattern(PHONE_REGEX)]],
                address: ['', [Validators.required, Validators.minLength(5)]],
            }),
            items: this.fb.array([])
        });

        this.loadCartFromBackend(); // lấy giỏ từ backend
    }

    get items(): FormArray {
        return this.form.get('items') as FormArray;
    }

    private loadCartFromBackend(): void {
        this.loading = true;
        this.loadError = null;

        // TODO: nếu baseUrl khác, thay '/api' cho phù hợp (proxy.conf.json)
        this.http.get<CartItem[]>('/api/cart').subscribe({
            next: cartItems => {
                this.items.clear();
                for (const it of cartItems) {
                    // giữ controls ENABLED để còn tính subtotal/tax/total; input đặt readonly ở template
                    this.items.push(this.fb.group({
                        productName: [it.productName, [Validators.required, Validators.minLength(2)]],
                        price: [it.price, [Validators.required, Validators.min(0)]],
                        quantity: [it.quantity, [Validators.required, Validators.min(1)]],
                    }));
                }
                this.loading = false;
            },
            error: err => {
                this.loading = false;
                this.loadError = 'Không tải được giỏ hàng. Vui lòng thử lại.';
                // optional: console.error(err);
            }
        });
    }

    isInvalid(path: string): boolean {
        const ctrl = this.form.get(path);
        return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
    }

    proceedToPayment(): void {
        if (this.form.invalid || this.items.length === 0 || this.subtotal() <= 0) {
            this.form.markAllAsTouched();
            return;
        }

        // Tạo order payload gửi server (KHÔNG tự sinh id phía client)
        const orderDraft = {
            customer: this.form.value.customer,
            items: this.form.value.items as CartItem[],
            subtotal: +this.subtotal().toFixed(2),
            tax: +this.tax().toFixed(2),
            total: +this.total().toFixed(2),
        };

        this.loading = true;
        this.http.post<{ id: string }>('/api/orders', orderDraft).subscribe({
            next: res => {
                this.loading = false;
                this.orderId.set(res.id);

                const order: Order = {
                    id: res.id,
                    ...orderDraft
                };

                // Lưu tạm cho Payment đọc nhanh (dù Payment sẽ gọi lại backend theo id)
                localStorage.setItem('orderDraft', JSON.stringify(order));

                // Điều hướng kèm query param để Payment chắc chắn lấy đúng đơn
                this.router.navigate(['/payment'], { queryParams: { orderId: res.id } });
            },
            error: err => {
                this.loading = false;
                this.loadError = 'Không tạo được đơn hàng. Vui lòng thử lại.';
                // optional: console.error(err);
            }
        });
    }

    trackByIndex = (_: number, __: unknown) => _;
}
