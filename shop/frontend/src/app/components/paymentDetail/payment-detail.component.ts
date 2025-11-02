import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, of, shareReplay, tap } from 'rxjs';

export interface CartItem {
    productName: string;
    price: number;
    quantity: number;
}

export interface OrderDraft {
    userId: string | null; // gửi kèm cho backend nếu cần
    customer: { cccd: string; address: string };
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
}
export interface OrderCreated { id: string; }

export interface User {
    id: string;
    email: string;
    fullName?: string;
    cccd?: string;
    address?: string;
    createdAt?: string;
}

const CCCD_REGEX = /^\d{12}$/;  // 12 số
const TAX_RATE = 0.1;

@Component({
    selector: 'app-payment-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
    templateUrl: './payment-detail.component.html',
    styleUrls: ['./payment-detail.component.css']
})
export class PaymentDetailComponent implements OnInit {
    private readonly http   = inject(HttpClient);
    private readonly fb     = inject(FormBuilder);
    private readonly router = inject(Router);

    // Lưu userId để đính kèm vào order
    currentUserId = signal<string | null>(null);

    // Lấy user & prefill CCCD/địa chỉ nếu trống
    user$ = this.http.get<User>('/api/me').pipe(
        tap(u => {
            this.currentUserId.set(u?.id ?? null);
            this.prefillFromUser(u);
        }),
        shareReplay(1),
        catchError(() => of(null))
    );

    // ❗ Không còn name trong form
    form: FormGroup = this.fb.group({
        customer: this.fb.group({
            cccd: ['', [Validators.required, Validators.pattern(CCCD_REGEX)]],
            address: ['', [Validators.required, Validators.minLength(5)]],
        }),
        items: this.fb.array<FormGroup>([])
    });

    get items(): FormArray<FormGroup> {
        return this.form.get('items') as FormArray<FormGroup>;
    }

    loading   = signal(false);
    loadError = signal<string | null>(null);
    orderId   = signal<string | null>(null);

    subtotal = computed(() =>
        this.items.controls.reduce((sum, ctrl) => {
            const p = Number(ctrl.get('price')?.value || 0);
            const q = Number(ctrl.get('quantity')?.value || 0);
            return sum + p * q;
        }, 0)
    );
    tax   = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
    total = computed(() => +(this.subtotal() + this.tax()).toFixed(2));

    ngOnInit(): void {
        this.loadCartFromBackend();
    }

    private prefillFromUser(u: User | null) {
        if (!u) return;
        const c = this.form.get('customer')!;
        const blank = (v: unknown) => v == null || `${v}`.trim() === '';
        if (blank(c.get('cccd')?.value)   && u.cccd)   c.get('cccd')?.setValue(u.cccd);
        if (blank(c.get('address')?.value) && u.address) c.get('address')?.setValue(u.address);
    }

    private loadCartFromBackend(): void {
        this.loading.set(true);
        this.loadError.set(null);

        this.http.get<CartItem[]>('/api/cart').subscribe({
            next: (cart) => {
                this.items.clear();
                (Array.isArray(cart) ? cart : []).forEach(it => {
                    this.items.push(this.fb.group({
                        productName: [it.productName, [Validators.required, Validators.minLength(2)]],
                        price: [it.price, [Validators.required, Validators.min(0)]],
                        quantity: [it.quantity, [Validators.required, Validators.min(1)]],
                    }));
                });
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.loadError.set('Không tải được giỏ hàng. Vui lòng thử lại.');
            }
        });
    }

    isInvalid(path: string): boolean {
        const ctl = this.form.get(path);
        return !!ctl && ctl.invalid && (ctl.dirty || ctl.touched);
    }

    proceedToPayment(): void {
        if (this.form.invalid || this.items.length === 0 || this.subtotal() <= 0) {
            this.form.markAllAsTouched();
            return;
        }

        const draft: OrderDraft = {
            userId: this.currentUserId(),
            customer: this.form.value.customer, // { cccd, address }
            items: this.form.value.items as CartItem[],
            subtotal: +this.subtotal().toFixed(2),
            tax: +this.tax().toFixed(2),
            total: +this.total().toFixed(2),
        };

        this.loading.set(true);
        this.http.post<OrderCreated>('/api/orders', draft).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.orderId.set(res.id);
                localStorage.setItem('orderDraft', JSON.stringify({ id: res.id, ...draft }));
                this.router.navigate(['/payment'], { queryParams: { orderId: res.id } });
            },
            error: () => {
                this.loading.set(false);
                this.loadError.set('Không tạo được đơn hàng. Vui lòng thử lại.');
            }
        });
    }

    trackByIndex = (i: number) => i;
}
