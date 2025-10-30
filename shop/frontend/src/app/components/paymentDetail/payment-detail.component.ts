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
    userId: string | null;
    customer: { address: string }; // gửi full địa chỉ đã ghép
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
    address?: string;    // full string từ DB: "12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM"
    createdAt?: string;
}

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

    currentUserId = signal<string | null>(null);

    user$ = this.http.get<User>('/api/me').pipe(
        tap(u => {
            this.currentUserId.set(u?.id ?? null);
            this.prefillFromUser(u);
        }),
        shareReplay(1),
        catchError(() => of(null))
    );

    // ⬇️ Địa chỉ tách thành 3 trường
    form: FormGroup = this.fb.group({
        customer: this.fb.group({
            address: this.fb.group({
                street:  ['', [Validators.required, Validators.minLength(3)]], // Số nhà, đường
                district:['', [Validators.required, Validators.minLength(2)]], // Quận/Huyện
                city:    ['', [Validators.required, Validators.minLength(2)]], // Thành phố/Tỉnh
            }),
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

    // Điền sẵn address nếu DB có (tách theo dấu phẩy)
    private prefillFromUser(u: User | null) {
        if (!u?.address) return;
        const a = this.form.get('customer.address') as FormGroup;
        const blank = (v: unknown) => v == null || `${v}`.trim() === '';

        const parts = u.address.split(',').map(s => s.trim());
        const street   = parts[0] ?? '';
        const district = parts[1] ?? '';
        const city     = parts.slice(2).join(', ') || '';

        if (blank(a.get('street')?.value)   && street)   a.get('street')?.setValue(street);
        if (blank(a.get('district')?.value) && district) a.get('district')?.setValue(district);
        if (blank(a.get('city')?.value)     && city)     a.get('city')?.setValue(city);
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

        // Ghép địa chỉ đầy đủ trước khi gửi
        const addr = (this.form.get('customer.address') as FormGroup).value as {
            street: string; district: string; city: string;
        };
        const fullAddress = [addr.street, addr.district, addr.city]
            .map(s => (s || '').trim())
            .filter(Boolean)
            .join(', ');

        const draft: OrderDraft = {
            userId: this.currentUserId(),
            customer: { address: fullAddress },
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
