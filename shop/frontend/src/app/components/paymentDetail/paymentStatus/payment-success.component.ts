import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
    standalone: true,
    selector: 'app-payment-success',
    imports: [CommonModule, RouterModule],
    template: `
        <div class="frame" style="text-align: center; padding: 40px; max-width: 600px; margin: 20px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

            <div *ngIf="status === 'PENDING'" class="card pending">
                <h3 style="color: #007bff;">Đang xác nhận thanh toán...</h3>
                <p>Vui lòng không tắt trình duyệt. Chúng tôi đang kiểm tra giao dịch của bạn.</p>
                <p>Mã đơn hàng: <b>#{{ billId }}</b></p>
            </div>
            <div *ngIf="status === 'PAID'" class="card success">
                <h3 style="color: #28a745;">Thanh toán thành công!</h3>
                <p>Cảm ơn bạn đã mua hàng. Đơn hàng <b>#{{ billId }}</b> đã được xác nhận.</p>
                <p style="font-size: 14px; color: #555;">Bạn sẽ được chuyển về trang chủ sau vài giây.</p>
            </div>
            <div *ngIf="status === 'FAILED'" class="card failed">
                <h3 style="color: #dc3545;">Thanh toán thất bại!</h3>
                <p>Đã có lỗi xảy ra hoặc giao dịch đã bị hủy.</p>
                <a class="btn" routerLink="/home" style="text-decoration: none; padding: 10px 20px; background-color: #007bff; color: white; border-radius: 5px;">Về trang chủ</a>
            </div>
        </div>
    `
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {

    billId: string | null = null;
    status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
    private pollSubscription?: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private paymentService: PaymentService
    ) {}

    ngOnInit(): void {
        // 1. Lấy billId từ URL (backend đã gửi về qua returnUrl)
        this.billId = this.route.snapshot.queryParamMap.get('billId');

        if (!this.billId) {
            this.status = 'FAILED';
            console.error('Không tìm thấy billId trên URL');
            return;
        }

        // 2. Bắt đầu Polling:
        this.pollSubscription = timer(0, 3000).pipe( // Gọi ngay, lặp lại mỗi 3s
            switchMap(() => this.paymentService.getBillPayStatus(this.billId!))
        ).subscribe({
            next: (response: any) => {
                // Backend trả về: { ..., status: "PAID" } hoặc { ..., status: "PENDING" }
                // (Chúng ta giả định webhook sẽ đổi status thành "PAID" hoặc "CONFIRMED")
                const currentStatus = response.status.toUpperCase();

                if (currentStatus === 'PAID' || currentStatus === 'CONFIRMED') {
                    // 3. THÀNH CÔNG
                    this.status = 'PAID';
                    this.pollSubscription?.unsubscribe();
                    sessionStorage.removeItem('orderDraft');

                    setTimeout(() => {
                        this.router.navigate(['/']); // Về trang chủ
                    }, 3000);

                } else if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED') {
                    this.status = 'FAILED';
                    this.pollSubscription?.unsubscribe();
                }
            },
            error: (err) => {
                console.error('Lỗi khi polling trạng thái:', err);
                this.status = 'FAILED';
                this.pollSubscription?.unsubscribe();
            }
        });
    }

    ngOnDestroy(): void {
        this.pollSubscription?.unsubscribe();
    }
}
