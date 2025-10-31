import {Component, OnInit, computed, signal, inject, ChangeDetectorRef} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {finalize, tap, catchError, of, shareReplay, startWith, firstValueFrom} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop'; //
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { BillService } from '../../services/bill.service';
import {BillCreateRequest} from "../../models/bill.model";
import { UserService } from '../../services/user.service';
import { User, Address} from "../../models/user.model";

const PHONE_REGEX = /^(0|\+84)(\d){9,10}$/;
const TAX_RATE = 0.1;

@Component({
    selector: 'app-payment-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule, CurrencyPipe],
    templateUrl: './payment-detail.component.html',
    styleUrl: './payment-detail.component.css'
})

export class PaymentDetailComponent implements OnInit {
    orderId = signal<string | null>(null);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    // private http = inject(HttpClient);
    private cartService = inject(CartService);
    private cdr = inject(ChangeDetectorRef);
    private billService = inject(BillService);
    private userService = inject(UserService);

    form: FormGroup = this.fb.group({
        customer: this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            phone: ['', [Validators.required, Validators.pattern(PHONE_REGEX)]],
            email: ['', [Validators.required, Validators.email]],
            address: this.fb.group({ // Cấu trúc 3 trường
                street:  ['', [Validators.required, Validators.minLength(3)]],
                district:['', [Validators.required, Validators.minLength(2)]],
                city:    ['', [Validators.required, Validators.minLength(2)]],
            }),
        }),
        items: this.fb.array([])
    });

    private formValueSignal = toSignal(
        this.form.valueChanges.pipe(
            startWith(this.form.value)
        ),
        { initialValue: { customer: {}, items: [] } }
    );

    subtotal = computed(() => {
        const formValue = this.formValueSignal();
        const items = formValue.items || [];
        return items.reduce((sum: number, item: any) => {
            const p = Number(item.unitPrice || 0);
            const q = Number(item.quantity || 0);
            return sum + p * q;
        }, 0)
        }
    );
    tax = computed(() => +(this.subtotal() * TAX_RATE).toFixed(2));
    total = computed(() => +(this.subtotal() + this.tax()).toFixed(2));

    loading = false;
    loadError: string | null = null;
    creatingOrder = false;
    createOrderError: string | null = null;

    constructor() {}

    ngOnInit(): void {
        this.loadSelectedCartItems();
        this.loadCurrentUser();
    }

    get items(): FormArray {
        return this.form.get('items') as FormArray;
    }

    private loadCurrentUser(): void {
        this.userService.getMe().pipe(
            tap(user => {
                if (user) {
                    this.prefillForm(user);
                }
            }),
            catchError(() => {
                console.warn(`Không tải được thông tin người dùng. Vui lòng tự điền thủ công.`);
                return of(null);
            })
        ).subscribe();
    }

    private prefillForm(user: User): void {
        const customerForm = this.form.get('customer');
        if (!customerForm) return;
        // Điền thông tin
        customerForm.get('name')?.setValue(user.FullName || '');
        customerForm.get('phone')?.setValue(user.PhoneNumber || '');
        customerForm.get('email')?.setValue(user.email || '');

        const userAddress = user.address;
        if (userAddress) {
            const addressForm = customerForm.get('address');
            if (addressForm) {
                const street = [userAddress.line1, userAddress.line2].filter(Boolean).join(', ');
                addressForm.get('street')?.setValue(street);
                addressForm.get('district')?.setValue(userAddress.district || '');
                addressForm.get('city')?.setValue(userAddress.province || userAddress.city || '');
            }
        }
        this.cdr.detectChanges();
    }


    private loadSelectedCartItems(): void {
        this.loading = true;
        this.loadError = null;
        this.items.clear();

        const selectedIdsJson = sessionStorage.getItem('selectedCartItemIds');
        let selectedVariantIds: number[] = [];
        if (selectedIdsJson) {
            try { selectedVariantIds = JSON.parse(selectedIdsJson); } catch (e) {
                console.error("Lỗi parse sessionStorage:", e);
            }
        }

        if (selectedVariantIds.length === 0) {
            this.loadError = "Không có sản phẩm nào được chọn. Vui lòng quay lại giỏ hàng.";
            this.loading = false;
            return;
        }
        this.cartService.getCart().pipe(
            finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (fullCart) => {
                if (fullCart && fullCart.items) {
                    const selectedItems = fullCart.items.filter(item =>
                        selectedVariantIds.includes(item.variantId)
                    );
                    for (const it of selectedItems) {
                        this.items.push(this.fb.group({
                            variantId: [it.variantId],
                            productName: [it.productName],
                            unitPrice: [it.price, [Validators.required, Validators.min(0)]],
                            quantity: [it.quantity, [Validators.required, Validators.min(1)]],
                            color: [it.color],
                            size: [it.size]
                        }));
                    }
                    if (selectedItems.length === 0) {
                        this.loadError = "Các sản phẩm đã chọn không còn trong giỏ hàng.";
                    }
                    this.cdr.detectChanges();
                } else {
                    this.loadError = "Giỏ hàng trống hoặc không hợp lệ.";
                }
            },
            error: (err) => {
                console.error('Lỗi tải giỏ hàng cho payment-detail:', err);
                this.loadError = 'Không thể tải thông tin giỏ hàng.';
                this.cdr.detectChanges();
            }
        });
    }

    isInvalid(path: string): boolean {
        const ctrl = this.form.get(path);
        return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
    }

    async proceedToPayment(): Promise<void> {
        this.createOrderError = null;
        if (this.form.invalid || this.items.length === 0 || this.subtotal() <= 0) {
            this.form.markAllAsTouched();
            console.warn("Form không hợp lệ:", this.form.errors, this.form.value);
            return;
        }

        this.creatingOrder = true;
        this.cdr.detectChanges();

        const customerInfo = this.form.get('customer')?.value;
        const addr = customerInfo.address;
        const fullAddress = [addr.street, addr.district, addr.city]
            .map((s: string) => (s || '').trim())
            .filter(Boolean)
            .join(', ');

        const orderItemsPayload = this.items.value.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity
        }));

        const createBillPayload = {
            FullName: customerInfo.name,
            Phone: customerInfo.phone,
            Email: customerInfo.email,
            ShippingAddress: fullAddress,
            details: orderItemsPayload,
            paymentMethod: 'COD'
        };

        const orderDraftForSession = {
            FullName: customerInfo.name,
            Phone: customerInfo.phone,
            Email: customerInfo.email,
            ShippingAddress: fullAddress,
            fullItems: this.items.value,
        };


        try {
            const newBill = await firstValueFrom(this.billService.createBill(createBillPayload));

            if (!newBill || !newBill.id) {
                throw new Error("API tạo bill không trả về ID.");
            }

            const realBillId = newBill.id;

            sessionStorage.setItem('orderDraft', JSON.stringify(orderDraftForSession));

            this.router.navigate(['/payment'], {
                queryParams: { orderId: realBillId }
            });

        } catch (e){
            console.error("Lỗi khi tạo Bill hoặc lưu đơn nháp:", e);
            this.createOrderError = "Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.";
        } finally {
            this.creatingOrder = false;
            this.cdr.detectChanges();
        }
    }

    trackByIndex = (_: number, __: unknown) => _;
}




